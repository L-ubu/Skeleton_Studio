import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Toolbar from "./components/Toolbar/Toolbar";
import ScratchLayout from "./components/layouts/ScratchLayout";
import SplitLayout from "./components/layouts/SplitLayout";
import CanvasLayout from "./components/layouts/CanvasLayout";

function PlaceholderPalette() {
  return <div className="p-4 text-gray-500 text-xs">Block palette goes here</div>;
}
function PlaceholderCanvas() {
  return <div className="p-4 text-gray-500 text-xs">Flow canvas goes here</div>;
}
function PlaceholderProperties() {
  return <div className="p-4 text-gray-500 text-xs">Properties panel goes here</div>;
}

export default function App() {
  const { layout, setEngineStatus, setCurrentFrame } = useStore();

  useEffect(() => {
    const cleanupEvents = window.electronAPI?.onEngineEvent((data) => {
      if (data.type === "status") {
        setEngineStatus({ running: true, fps: data.fps, hands: data.hands, enabled: data.enabled });
      } else if (data.type === "gesture") {
        setEngineStatus({ currentGesture: data.name, confidence: data.confidence });
      }
    });
    const cleanupFrames = window.electronAPI?.onVideoFrame((b64) => {
      setCurrentFrame(b64);
    });
    return () => { cleanupEvents?.(); cleanupFrames?.(); };
  }, []);

  const palette = <PlaceholderPalette />;
  const canvas = <PlaceholderCanvas />;
  const properties = <PlaceholderProperties />;

  const Layout = layout === "scratch" ? ScratchLayout : layout === "split" ? SplitLayout : CanvasLayout;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a] text-white">
      <Toolbar />
      <Layout palette={palette} canvas={canvas} properties={properties} />
    </div>
  );
}
