import WebcamViewer from "../WebcamViewer/WebcamViewer";

export default function SplitLayout({
  palette,
  canvas,
  properties,
}: {
  palette: React.ReactNode;
  canvas: React.ReactNode;
  properties: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top: big webcam */}
      <WebcamViewer className="h-64 m-2" />
      {/* Bottom: palette + canvas + props */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-[#222] overflow-y-auto">{palette}</div>
        <div className="flex-1 overflow-auto">{canvas}</div>
        <div className="w-56 border-l border-[#222] overflow-y-auto">{properties}</div>
      </div>
    </div>
  );
}
