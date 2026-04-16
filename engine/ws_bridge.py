"""WebSocket bridge: connects Python engine to Electron GUI."""

import asyncio
import json
import sys
import cv2
import time
import struct
import websockets

from gesture_command.capture import Camera
from gesture_command.tracker import HandTracker, draw_landmarks
from gesture_command.recognizer import recognize, extended_fingers
from gesture_command.continuous import ContinuousRecognizer
from gesture_command.continuous_actions import create_continuous_action
from gesture_command.filters import FilterPipeline
from gesture_command.actions import execute_action
from gesture_command.mapper import Config


class EngineBridge:
    def __init__(self, ws_url="ws://localhost:9150", config_path=None):
        self.ws_url = ws_url
        self.config = Config(config_path=config_path)
        self.config.load()
        self.enabled = True
        self._running = False

        self.camera = Camera(camera_index=self.config.camera_index)
        self.tracker = HandTracker(max_hands=2)
        self.filters = FilterPipeline(
            default_dwell_ms=self.config.default_dwell_ms,
            default_cooldown_ms=self.config.default_cooldown_ms,
            confidence_threshold=self.config.confidence_threshold,
        )
        self.continuous_recognizer = ContinuousRecognizer()
        self.continuous_actions = {}
        self._setup_from_config()

    def _setup_from_config(self):
        for gesture_name in self.config.get_discrete_gestures():
            overrides = self.config.get_gesture_overrides(gesture_name)
            if overrides:
                self.filters.set_gesture_overrides(gesture_name, **overrides)

        for channel_name, mapping in self.config.get_continuous_mappings().items():
            smoothing = mapping.get("smoothing", 0.3)
            dead_zone = mapping.get("dead_zone", 0.02)
            activation_ms = mapping.get("activation_ms", 0)
            self.continuous_recognizer.add_channel(channel_name, smoothing, dead_zone, activation_ms)

            action_config = dict(mapping.get("action", {}))
            if "update_interval_ms" in mapping:
                action_config["update_interval_ms"] = mapping["update_interval_ms"]
            if "invert" in mapping:
                action_config["invert"] = mapping["invert"]
            self.continuous_actions[channel_name] = create_continuous_action(action_config)

    async def run(self):
        self._running = True
        self.camera.open()

        async with websockets.connect(self.ws_url) as ws:
            receive_task = asyncio.create_task(self._receive_commands(ws))

            detect_every = 2
            frame_count = 0
            prev_time = time.time()
            fps = 0.0
            cached_hands = []

            try:
                while self._running:
                    frame = self.camera.read()
                    if frame is None:
                        await asyncio.sleep(0.001)
                        continue

                    frame = cv2.flip(frame, 1)
                    frame_count += 1

                    now = time.time()
                    dt = now - prev_time
                    prev_time = now
                    fps = 0.9 * fps + 0.1 * (1.0 / dt if dt > 0 else 0)

                    if frame_count % detect_every == 0:
                        cached_hands = self.tracker.process(frame)

                        for hand in cached_hands:
                            hand_id = hand.handedness
                            result = recognize(hand, self.config.confidence_threshold)
                            fingers = extended_fingers(hand)
                            gesture_name = result[0] if result else None
                            confidence = result[1] if result else 0.0

                            if gesture_name:
                                await ws.send(json.dumps({
                                    "type": "gesture",
                                    "name": gesture_name,
                                    "confidence": round(confidence, 3),
                                    "hand": hand_id,
                                    "fingers": fingers,
                                }))

                            if self.enabled:
                                fired = self.filters.update(hand_id, gesture_name, confidence if gesture_name else 0.0)
                                if fired:
                                    action = self.config.get_gesture_action(fired)
                                    if action:
                                        execute_action(action)
                                        await ws.send(json.dumps({
                                            "type": "fired",
                                            "gesture": fired,
                                            "hand": hand_id,
                                        }))

                            if self.enabled:
                                values = self.continuous_recognizer.update(hand)
                                for ch, val in values.items():
                                    if ch in self.continuous_actions:
                                        self.continuous_actions[ch].execute(val)
                                    await ws.send(json.dumps({
                                        "type": "continuous",
                                        "channel": ch,
                                        "value": round(val, 4),
                                    }))

                    for hand in cached_hands:
                        draw_landmarks(frame, hand)

                    _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                    jpeg_bytes = jpeg.tobytes()
                    sys.stdout.buffer.write(struct.pack(">I", len(jpeg_bytes)))
                    sys.stdout.buffer.write(jpeg_bytes)
                    sys.stdout.buffer.flush()

                    if frame_count % 30 == 0:
                        await ws.send(json.dumps({
                            "type": "status",
                            "fps": round(fps, 1),
                            "hands": len(cached_hands),
                            "enabled": self.enabled,
                        }))

                    await asyncio.sleep(0.001)

            finally:
                receive_task.cancel()
                self.camera.close()
                self.tracker.close()

    async def _receive_commands(self, ws):
        try:
            async for message in ws:
                data = json.loads(message)
                if data.get("type") == "command":
                    action = data.get("action")
                    if action == "pause":
                        self.enabled = False
                    elif action == "start":
                        self.enabled = True
                    elif action == "stop":
                        self._running = False
                elif data.get("type") == "config_update":
                    pass
        except websockets.ConnectionClosed:
            self._running = False


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ws-url", default="ws://localhost:9150")
    parser.add_argument("--config", default=None)
    args = parser.parse_args()

    bridge = EngineBridge(ws_url=args.ws_url, config_path=args.config)
    asyncio.run(bridge.run())


if __name__ == "__main__":
    main()
