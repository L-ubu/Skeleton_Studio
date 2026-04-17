"""WebSocket bridge — threaded WebSocket, synchronous main loop.

The original asyncio loop was the lag source: cv2.imshow() and
tracker.process() blocked the event loop, starving WebSocket I/O
and making commands (pause/resume) unresponsive.

Fix: plain while-loop on the main thread + WebSocket in its own thread.
Camera capture is already threaded (Camera class). Detection stays
synchronous (VIDEO mode) — it works, just runs every Nth frame.
"""

import threading
import time
import json
import sys
import cv2
import asyncio
import websockets

from gesture_command.capture import Camera
from gesture_command.tracker import HandTracker, draw_landmarks
from gesture_command.recognizer import recognize
from gesture_command.continuous import ContinuousRecognizer
from gesture_command.filters import FilterPipeline
from gesture_command.actions import execute_action
from gesture_command.continuous_actions import create_continuous_action
from gesture_command.mouse_mode import MouseMode
from pynput.keyboard import GlobalHotKeys


class WebSocketThread:
    """WebSocket client in its own thread with its own asyncio loop."""

    def __init__(self, uri: str):
        self.uri = uri
        self._send_queue: list[str] = []
        self._send_lock = threading.Lock()
        self._commands: list[dict] = []
        self._cmd_lock = threading.Lock()
        self._connected = threading.Event()
        self._stopped = False

    def start(self):
        threading.Thread(target=self._run, daemon=True).start()
        return self

    def _run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self._ws_loop())

    async def _ws_loop(self):
        try:
            ws = await websockets.connect(self.uri)
        except Exception as e:
            print(f"[ws] Connect failed: {e}", file=sys.stderr)
            return

        self._connected.set()
        recv_task = asyncio.create_task(self._recv_loop(ws))
        send_task = asyncio.create_task(self._send_loop(ws))

        done, pending = await asyncio.wait(
            [recv_task, send_task], return_when=asyncio.FIRST_COMPLETED,
        )
        for t in pending:
            t.cancel()
        try:
            await ws.close()
        except Exception:
            pass

    async def _recv_loop(self, ws):
        try:
            async for message in ws:
                data = json.loads(message)
                with self._cmd_lock:
                    self._commands.append(data)
        except websockets.ConnectionClosed:
            pass

    async def _send_loop(self, ws):
        while not self._stopped:
            with self._send_lock:
                batch = self._send_queue[:]
                self._send_queue.clear()
            for msg in batch:
                try:
                    await ws.send(msg)
                except websockets.ConnectionClosed:
                    return
            await asyncio.sleep(0.008)

    def send(self, data: dict):
        with self._send_lock:
            self._send_queue.append(json.dumps(data))

    def poll_commands(self) -> list[dict]:
        with self._cmd_lock:
            cmds = self._commands[:]
            self._commands.clear()
        return cmds

    def wait_connected(self, timeout=10) -> bool:
        return self._connected.wait(timeout)

    def stop(self):
        self._stopped = True


class EngineBridge:
    def __init__(self, ws_url="ws://localhost:9150", show_camera=False):
        self.ws_url = ws_url
        self.show_camera = show_camera
        self.enabled = True
        self._running = False

        self.camera = Camera(camera_index=0)
        self.tracker = HandTracker(max_hands=2)
        self.continuous_recognizer = ContinuousRecognizer()
        self.filters = FilterPipeline(
            default_dwell_ms=300, default_cooldown_ms=500, confidence_threshold=0.7,
        )

        self.gesture_actions: dict[str, dict] = {}
        self.gesture_hand_filters: dict[str, str] = {}
        self.continuous_actions: dict = {}

        self.skeleton_only = False
        self.mouse_mode_enabled = False
        self.mouse_mode = MouseMode()

    def _apply_config(self, config: dict):
        gestures = config.get("gestures", {})
        continuous = config.get("continuous", {})

        self.gesture_actions.clear()
        self.gesture_hand_filters.clear()
        self.continuous_actions.clear()
        # Reset recognizer so removed channels don't linger
        self.continuous_recognizer = ContinuousRecognizer()

        for key, mapping in gestures.items():
            action = mapping.get("action")
            if not action:
                continue
            gesture_name = key.split(":")[0]
            self.gesture_actions[key] = action
            self.gesture_hand_filters[key] = mapping.get("hand", "any")
            self.filters.set_gesture_overrides(
                gesture_name,
                dwell_ms=mapping.get("dwell_ms", 300),
                cooldown_ms=mapping.get("cooldown_ms", 500),
            )

        for key, mapping in continuous.items():
            action_cfg = mapping.get("action")
            if not action_cfg:
                continue
            self.continuous_recognizer.add_channel(
                key,
                smoothing=mapping.get("smoothing", 0.3),
                dead_zone=mapping.get("dead_zone", 0.03),
                activation_ms=mapping.get("activation_ms", 0),
            )
            try:
                self.continuous_actions[key] = create_continuous_action(action_cfg)
            except ValueError:
                print(f"[bridge] Unknown continuous action: {action_cfg.get('type')}", file=sys.stderr)

        print(f"[bridge] Config: {len(self.gesture_actions)} gestures, {len(self.continuous_actions)} continuous", file=sys.stderr)

    def _fire_action(self, action: dict):
        threading.Thread(target=execute_action, args=(action,), daemon=True).start()

    def _match_gesture(self, gesture_name: str, hand_id: str) -> dict | None:
        specific = f"{gesture_name}:{hand_id}"
        if specific in self.gesture_actions:
            return self.gesture_actions[specific]
        if gesture_name in self.gesture_actions:
            hf = self.gesture_hand_filters.get(gesture_name, "any")
            if hf == "any" or hf.lower() == hand_id.lower():
                return self.gesture_actions[gesture_name]
        return None

    def _handle_command(self, data: dict):
        if data.get("type") == "command":
            action = data.get("action")
            if action == "pause":
                self.enabled = False
                print("[bridge] Paused", file=sys.stderr)
            elif action == "start":
                self.enabled = True
                print("[bridge] Resumed", file=sys.stderr)
            elif action == "stop":
                self._running = False
                print("[bridge] Stop requested", file=sys.stderr)
        elif data.get("type") == "config_update":
            self._apply_config(data.get("config", {}))

    def run(self):
        """Main loop — plain while, no asyncio. Runs on main thread for cv2."""
        self._running = True

        self.camera.open()
        if self.camera._cap:
            self.camera._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        print("[bridge] Camera opened", file=sys.stderr)

        # Global hotkey: Cmd+Shift+G toggles enabled
        def _toggle_enabled():
            self.enabled = not self.enabled
            state = "enabled" if self.enabled else "disabled"
            print(f"[bridge] Global hotkey: {state}", file=sys.stderr)

        hotkey_listener = GlobalHotKeys({"<cmd>+<shift>+g": _toggle_enabled})
        hotkey_listener.daemon = True
        hotkey_listener.start()

        ws = WebSocketThread(self.ws_url)
        ws.start()
        if not ws.wait_connected(timeout=10):
            print("[bridge] WebSocket timeout", file=sys.stderr)
            self.camera.close()
            return
        print("[bridge] Connected to Electron", file=sys.stderr)

        detect_every = 2  # detect every Nth frame, display all frames
        frame_count = 0
        prev_time = time.time()
        fps = 0.0
        cached_hands = []

        try:
            while self._running:
                # ── Commands (instant, non-blocking) ──
                for cmd in ws.poll_commands():
                    self._handle_command(cmd)

                # ── Grab latest frame (instant, threaded camera) ──
                frame = self.camera.read()
                if frame is None:
                    time.sleep(0.001)
                    continue

                frame = cv2.flip(frame, 1)
                frame_count += 1

                now = time.time()
                dt = now - prev_time
                prev_time = now
                fps = 0.9 * fps + 0.1 * (1.0 / dt if dt > 0 else 0)

                # ── Detect hands (every Nth frame) ──
                if frame_count % detect_every == 0:
                    cached_hands = self.tracker.process(frame)

                    for hand in cached_hands:
                        result = recognize(hand, 0.7)
                        gesture_name = result[0] if result else None
                        confidence = result[1] if result else 0.0

                        if gesture_name:
                            ws.send({
                                "type": "gesture", "name": gesture_name,
                                "confidence": round(confidence, 3),
                                "hand": hand.handedness,
                            })

                        if self.enabled and self.gesture_actions:
                            fired = self.filters.update(hand.handedness, gesture_name, confidence)
                            if fired:
                                action = self._match_gesture(fired, hand.handedness)
                                if action:
                                    print(f"[bridge] FIRED: {fired} → {action.get('type')}", file=sys.stderr)
                                    self._fire_action(action)
                                    ws.send({
                                        "type": "action_fired", "gesture": fired,
                                        "hand": hand.handedness,
                                        "action_type": action.get("type"),
                                    })

                    if self.enabled and self.continuous_actions:
                        for hand in cached_hands:
                            values = self.continuous_recognizer.update(hand)
                            for ch, val in values.items():
                                if ch in self.continuous_actions:
                                    self.continuous_actions[ch].execute(val)
                                ws.send({"type": "continuous", "channel": ch, "value": round(val, 4)})

                # ── Mouse mode (uses hand tracking data) ──
                if self.mouse_mode_enabled and self.enabled and cached_hands:
                    self.mouse_mode.update(cached_hands[0])
                elif self.mouse_mode_enabled and not cached_hands:
                    self.mouse_mode.reset()

                # ── Draw skeleton (cached hands, every frame) ──
                if self.skeleton_only:
                    frame[:] = 0
                for hand in cached_hands:
                    draw_landmarks(frame, hand)

                # ── Display (main thread for macOS) ──
                if self.show_camera:
                    cv2.imshow("Skeleton Studio - Camera", frame)
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord("q"):
                        self._running = False
                        break
                    elif key == ord("s"):
                        self.skeleton_only = not self.skeleton_only
                        print(f"[bridge] Skeleton-only: {self.skeleton_only}", file=sys.stderr)
                    elif key == ord("m"):
                        self.mouse_mode_enabled = not self.mouse_mode_enabled
                        if not self.mouse_mode_enabled:
                            self.mouse_mode.reset()
                        print(f"[bridge] Mouse mode: {self.mouse_mode_enabled}", file=sys.stderr)

                # ── Status ──
                if frame_count % 15 == 0:
                    ws.send({
                        "type": "status", "fps": round(fps, 1),
                        "hands": len(cached_hands), "enabled": self.enabled,
                        "skeleton_only": self.skeleton_only,
                        "mouse_mode": self.mouse_mode_enabled,
                    })

        finally:
            ws.stop()
            self.camera.close()
            self.tracker.close()
            if self.show_camera:
                cv2.destroyAllWindows()
            print("[bridge] Shut down cleanly", file=sys.stderr)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ws-url", default="ws://localhost:9150")
    parser.add_argument("--show-camera", action="store_true")
    args = parser.parse_args()

    bridge = EngineBridge(ws_url=args.ws_url, show_camera=args.show_camera)
    bridge.run()


if __name__ == "__main__":
    main()
