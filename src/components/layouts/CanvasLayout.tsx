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
        className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-[#16213e] border border-green-400 text-green-400 text-xs font-medium hover:bg-[#1a2a4e] z-10"
      >
        + Add Block
      </button>

      {/* Floating palette panel */}
      {showPalette && (
        <div className="absolute bottom-14 left-4 w-56 max-h-80 bg-[#111125] border border-[#333] rounded-lg overflow-y-auto shadow-xl z-10">
          {palette}
        </div>
      )}

      {/* Floating properties toggle (bottom-right) */}
      <button
        onClick={() => setShowProps(!showProps)}
        className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-[#16213e] border border-[#aa66ff] text-[#aa66ff] text-xs font-medium hover:bg-[#1a2a4e] z-10"
      >
        Properties
      </button>

      {showProps && (
        <div className="absolute bottom-14 right-4 w-64 max-h-96 bg-[#111125] border border-[#333] rounded-lg overflow-y-auto shadow-xl z-10">
          {properties}
        </div>
      )}
    </div>
  );
}
