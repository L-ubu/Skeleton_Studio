import { useEffect } from "react";
import { useStore } from "./store/useStore";
import Toolbar from "./components/Toolbar/Toolbar";
import BlockPalette from "./components/BlockPalette/BlockPalette";
import FlowEditor from "./components/FlowEditor/FlowEditor";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import ScratchLayout from "./components/layouts/ScratchLayout";
import SplitLayout from "./components/layouts/SplitLayout";
import CanvasLayout from "./components/layouts/CanvasLayout";

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

  const palette = <BlockPalette />;
  const canvas = <FlowEditor />;
  const properties = <PropertiesPanel />;
  const Layout = layout === "scratch" ? ScratchLayout : layout === "split" ? SplitLayout : CanvasLayout;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a1a] text-white">
      <Toolbar />
      <Layout palette={palette} canvas={canvas} properties={properties} />
    </div>
  );
}
