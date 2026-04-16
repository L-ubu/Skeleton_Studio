import { useStore } from "../../store/useStore";
import type { LayoutMode } from "../../types/blocks";

const layouts: { mode: LayoutMode; label: string }[] = [
  { mode: "scratch", label: "Scratch" },
  { mode: "split", label: "Split" },
  { mode: "canvas", label: "Canvas" },
];

export default function Toolbar() {
  const { layout, setLayout, engineStatus, addChain } = useStore();

  const handleStart = () => window.electronAPI?.startEngine();
  const handleStop = () => window.electronAPI?.stopEngine();
  const handlePause = () =>
    window.electronAPI?.sendToEngine({ type: "command", action: engineStatus.enabled ? "pause" : "start" });

  return (
    <div className="h-12 bg-[#111125] border-b border-[#222] flex items-center px-4 gap-4 select-none">
      {/* App title */}
      <span className="text-green-400 font-bold text-sm tracking-wide mr-4">SKELETON STUDIO</span>

      {/* Engine controls */}
      <div className="flex items-center gap-2">
        {!engineStatus.running ? (
          <button onClick={handleStart} className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs font-medium">
            Start Engine
          </button>
        ) : (
          <>
            <button onClick={handlePause} className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-xs font-medium">
              {engineStatus.enabled ? "Pause" : "Resume"}
            </button>
            <button onClick={handleStop} className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-xs font-medium">
              Stop
            </button>
          </>
        )}
        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full ${engineStatus.running ? (engineStatus.enabled ? "bg-green-400" : "bg-yellow-400") : "bg-red-400"}`} />
        <span className="text-xs text-gray-400">
          {engineStatus.running ? `${engineStatus.fps} FPS | ${engineStatus.hands} hands` : "Stopped"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Add chain */}
      <button onClick={addChain} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-green-400 text-xs text-green-400">
        + New Chain
      </button>

      <button onClick={() => useStore.getState().saveProject()} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-blue-400 text-xs text-blue-400">
        Save
      </button>
      <button onClick={() => useStore.getState().loadProject()} className="px-3 py-1 rounded bg-[#1a1a3a] border border-[#333] hover:border-blue-400 text-xs text-blue-400">
        Load
      </button>

      {/* Layout switcher */}
      <div className="flex rounded overflow-hidden border border-[#333]">
        {layouts.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setLayout(mode)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              layout === mode ? "bg-green-600 text-white" : "bg-[#1a1a3a] text-gray-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
