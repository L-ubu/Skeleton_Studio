import { useState } from "react";
import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function CanvasLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  const [showPalette, setShowPalette] = useState(false);
  const [showProps, setShowProps] = useState(false);

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Full canvas */}
      <div className="w-full h-full overflow-auto">{canvas}</div>

      {/* Floating webcam (top-right) */}
      <div className="absolute top-2 right-2 w-48">
        <WebcamViewer className="h-32" />
      </div>

      {/* Floating palette toggle (bottom-left) */}
      <button
        onClick={() => setShowPalette(!showPalette)}
        className={`absolute bottom-4 left-4 px-4 py-2 bg-[#111125] border text-xs font-medium z-10 transition-all duration-200 active:scale-95 ${
          showPalette ? "border-green-400 text-green-400 shadow-[0_0_12px_#00ff8820]" : "border-[#2a2a40] text-green-400/70 hover:border-green-400/50"
        }`}
      >
        + Add Block
      </button>

      {/* Floating palette panel */}
      {showPalette && (
        <div className="absolute bottom-14 left-4 w-56 max-h-80 bg-[#0d0d22] border border-[#2a2a40] overflow-y-auto shadow-2xl z-10 animate-fade-in-up">
          {palette}
        </div>
      )}

      {/* Floating properties toggle (bottom-right) */}
      <button
        onClick={() => setShowProps(!showProps)}
        className={`absolute bottom-4 right-4 px-4 py-2 bg-[#111125] border text-xs font-medium z-10 transition-all duration-200 active:scale-95 ${
          showProps ? "border-[#aa66ff] text-[#aa66ff] shadow-[0_0_12px_#aa66ff20]" : "border-[#2a2a40] text-[#aa66ff]/70 hover:border-[#aa66ff]/50"
        }`}
      >
        Properties
      </button>

      {showProps && (
        <div className="absolute bottom-14 right-4 w-64 max-h-96 bg-[#0d0d22] border border-[#2a2a40] overflow-y-auto shadow-2xl z-10 animate-fade-in-up">
          {properties}
        </div>
      )}
    </div>
  );
}
