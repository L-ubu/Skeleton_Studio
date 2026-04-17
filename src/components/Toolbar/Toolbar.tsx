import { useStore } from "../../store/useStore";
import type { LayoutMode } from "../../types/blocks";

const layouts: { mode: LayoutMode; label: string }[] = [
  { mode: "scratch", label: "Scratch" },
  { mode: "split", label: "Split" },
  { mode: "canvas", label: "Canvas" },
];

export default function Toolbar() {
  const { layout, setLayout, engineStatus, engineStarting, setEngineStarting, addChain } = useStore();

  const handleStart = () => {
    setEngineStarting(true);
    window.electronAPI?.startEngine();
  };
  const handleStop = () => {
    window.electronAPI?.stopEngine();
    useStore.setState({
      engineStatus: { running: false, enabled: false, fps: 0, hands: 0, currentGesture: null, confidence: 0 },
      currentFrame: null,
    });
  };
  const handlePause = () =>
    window.electronAPI?.sendToEngine({ type: "command", action: engineStatus.enabled ? "pause" : "start" });
  const isRunning = engineStatus.running;

  return (
    <div className="h-11 bg-[#0d0d22] border-b border-[#1a1a30] flex items-center px-4 gap-3 select-none">
      <span className="text-green-400 font-bold text-sm tracking-widest mr-3" style={{ fontFamily: "monospace" }}>
        SKELETON<span className="text-gray-500">_</span>STUDIO
      </span>

      {/* Engine controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={engineStarting}
            className={`px-3 py-1 text-xs font-semibold transition-all duration-200 ${
              engineStarting
                ? "bg-green-900/50 text-green-300 animate-pulse cursor-wait border border-green-700/50"
                : "bg-green-600 hover:bg-green-500 hover:shadow-[0_0_12px_#00ff8830] active:scale-95"
            }`}
          >
            {engineStarting ? "Starting..." : "Start Engine"}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <button onClick={handlePause} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-xs font-semibold transition-all duration-150 active:scale-95">
              {engineStatus.enabled ? "Pause" : "Resume"}
            </button>
            <button onClick={handleStop} className="px-3 py-1 bg-red-600/80 hover:bg-red-500 text-xs font-semibold transition-all duration-150 active:scale-95">
              Stop
            </button>
          </div>
        )}

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          isRunning ? (engineStatus.enabled ? "bg-green-400 animate-glow-pulse" : "bg-yellow-400")
          : engineStarting ? "bg-yellow-400 animate-pulse" : "bg-gray-600"
        }`} />
        <span className="text-[11px] text-gray-500 tabular-nums">
          {isRunning
            ? `${engineStatus.fps} FPS · ${engineStatus.hands} hands${engineStatus.currentGesture ? ` · ${engineStatus.currentGesture}` : ""}`
            : engineStarting ? "Loading camera & model..." : "Stopped"}
        </span>
      </div>

      <div className="flex-1" />

      <button onClick={addChain} className="px-3 py-1 bg-[#12122a] border border-[#2a2a40] hover:border-green-400/60 text-xs text-green-400 transition-all duration-200 hover:shadow-[0_0_8px_#00ff8815] active:scale-95">
        + New Chain
      </button>
      <button onClick={() => useStore.getState().saveProject()} className="px-3 py-1 bg-[#12122a] border border-[#2a2a40] hover:border-blue-400/60 text-xs text-blue-400/70 transition-all duration-200 active:scale-95">
        Save
      </button>
      <button onClick={() => useStore.getState().loadProject()} className="px-3 py-1 bg-[#12122a] border border-[#2a2a40] hover:border-blue-400/60 text-xs text-blue-400/70 transition-all duration-200 active:scale-95">
        Load
      </button>

      <div className="flex overflow-hidden border border-[#2a2a40]">
        {layouts.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setLayout(mode)}
            className={`px-3 py-1 text-xs font-medium transition-all duration-200 ${
              layout === mode
                ? "bg-green-600 text-white shadow-[inset_0_1px_0_#00ff8840]"
                : "bg-[#12122a] text-gray-500 hover:text-gray-300 hover:bg-[#16163a]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
