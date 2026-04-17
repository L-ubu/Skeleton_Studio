import { useStore } from "../../store/useStore";

export default function WebcamViewer({ className = "" }: { className?: string }) {
  const { engineStatus } = useStore();
  const isRunning = engineStatus.running;

  return (
    <div className={`bg-[#090918] overflow-hidden relative border border-[#1a1a30] ${className}`}>
      <div className="w-full h-full flex flex-col items-center justify-center p-3 gap-2">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
          isRunning ? (engineStatus.enabled ? "bg-green-400 shadow-[0_0_10px_#00ff88]" : "bg-yellow-400 shadow-[0_0_6px_#ffaa00]") : "bg-gray-700"
        }`} />

        <span className="text-[11px] font-medium text-gray-400 tracking-wide">
          {isRunning ? (engineStatus.enabled ? "Engine Active" : "Paused") : "Engine Stopped"}
        </span>

        {isRunning && (
          <div className="text-center space-y-1 animate-fade-in">
            <div className="text-[10px] text-gray-600 tabular-nums font-mono">{engineStatus.fps} FPS</div>
            <div className="text-[10px] text-gray-600">{engineStatus.hands} hand{engineStatus.hands !== 1 ? "s" : ""}</div>
            {engineStatus.currentGesture && (
              <div className="mt-1 px-2 py-0.5 bg-green-400/8 border border-green-400/20 animate-scale-in">
                <span className="text-green-400 text-[10px] font-bold tracking-wider">{engineStatus.currentGesture.toUpperCase()}</span>
                <span className="text-gray-600 text-[9px] ml-1">{Math.round(engineStatus.confidence * 100)}%</span>
              </div>
            )}
          </div>
        )}

        {!isRunning && (
          <p className="text-[9px] text-gray-700 text-center tracking-wide">Camera opens in a<br/>separate window</p>
        )}
      </div>
    </div>
  );
}
