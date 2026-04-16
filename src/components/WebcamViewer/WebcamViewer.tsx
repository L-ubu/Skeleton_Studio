import { useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";

export default function WebcamViewer({ className = "" }: { className?: string }) {
  const { currentFrame, engineStatus } = useStore();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && currentFrame) {
      imgRef.current.src = `data:image/jpeg;base64,${currentFrame}`;
    }
  }, [currentFrame]);

  return (
    <div className={`bg-black rounded-lg overflow-hidden relative ${className}`}>
      {currentFrame ? (
        <img ref={imgRef} alt="Webcam" className="w-full h-full object-contain" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
          {engineStatus.running ? "Connecting..." : "Engine not running"}
        </div>
      )}
      {/* Gesture overlay */}
      {engineStatus.currentGesture && (
        <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs">
          <span className="text-green-400 font-bold">{engineStatus.currentGesture.toUpperCase()}</span>
          <span className="text-gray-400 ml-2">{Math.round(engineStatus.confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
