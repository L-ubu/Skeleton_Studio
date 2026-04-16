import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function ScratchLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: palette */}
      <div className="w-56 border-r border-[#222] overflow-y-auto">{palette}</div>
      {/* Center: canvas */}
      <div className="flex-1 overflow-auto">{canvas}</div>
      {/* Right: webcam + properties */}
      <div className="w-64 border-l border-[#222] flex flex-col">
        <WebcamViewer className="h-40 m-2" />
        <div className="flex-1 overflow-y-auto">{properties}</div>
      </div>
    </div>
  );
}
