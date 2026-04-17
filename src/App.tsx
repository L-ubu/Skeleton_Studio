import { useEffect, useRef, useState } from "react";
import { useStore } from "./store/useStore";
import { chainsToEngineConfig } from "./utils/chainToConfig";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import Toolbar from "./components/Toolbar/Toolbar";
import BlockPalette from "./components/BlockPalette/BlockPalette";
import FlowEditor from "./components/FlowEditor/FlowEditor";
import PropertiesPanel from "./components/PropertiesPanel/PropertiesPanel";
import ScratchLayout from "./components/layouts/ScratchLayout";
import SplitLayout from "./components/layouts/SplitLayout";
import CanvasLayout from "./components/layouts/CanvasLayout";
import { BLOCK_DEFINITIONS } from "./types/blocks";

function sendConfig() {
  const config = chainsToEngineConfig(useStore.getState().chains);
  window.electronAPI?.sendToEngine({ type: "config_update", config });
}

export default function App() {
  const { layout, chains, setEngineStatus, setLastFiredGesture, addBlockToChain } = useStore();
  const [draggingBlock, setDraggingBlock] = useState<{ id: string; color: string; icon: string; label: string } | null>(null);
  const engineConnected = useRef(false);

  useEffect(() => {
    const cleanupEvents = window.electronAPI?.onEngineEvent((data) => {
      if (data.type === "status") {
        const running = data.running !== false;
        setEngineStatus({ running, fps: data.fps, hands: data.hands, enabled: data.enabled });
        if (running && !engineConnected.current) {
          // First status = engine just connected. Send current config.
          engineConnected.current = true;
          sendConfig();
        } else if (!running) {
          engineConnected.current = false;
        }
      } else if (data.type === "gesture") {
        setEngineStatus({ currentGesture: data.name, confidence: data.confidence });
      } else if (data.type === "action_fired") {
        setLastFiredGesture(data.gesture);
        setTimeout(() => setLastFiredGesture(null), 600);
      }
    });
    return () => { cleanupEvents?.(); engineConnected.current = false; };
  }, []);

  // Re-send config whenever chains change (if engine is connected)
  useEffect(() => {
    if (engineConnected.current) sendConfig();
  }, [chains]);

  const handleDragStart = (event: DragStartEvent) => {
    const defId = event.active.data.current?.definitionId;
    const def = BLOCK_DEFINITIONS.find((d) => d.id === defId);
    if (def) setDraggingBlock({ id: def.id, color: def.color, icon: def.icon, label: def.label });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingBlock(null);
    const { active, over } = event;
    if (!over) return;
    const definitionId = active.data.current?.definitionId;
    const chainId = over.data.current?.chainId;
    if (definitionId && chainId) {
      addBlockToChain(chainId, definitionId);
    }
  };

  const palette = <BlockPalette />;
  const canvas = <FlowEditor />;
  const properties = <PropertiesPanel />;
  const Layout = layout === "scratch" ? ScratchLayout : layout === "split" ? SplitLayout : CanvasLayout;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-[#0a0a1a] text-white">
        <Toolbar />
        <Layout palette={palette} canvas={canvas} properties={properties} />
      </div>
      <DragOverlay dropAnimation={null}>
        {draggingBlock && (
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold pointer-events-none border animate-scale-in"
            style={{
              backgroundColor: draggingBlock.color + "20",
              borderColor: draggingBlock.color + "80",
              color: draggingBlock.color,
              boxShadow: `0 0 24px ${draggingBlock.color}30, 0 4px 12px rgba(0,0,0,0.3)`,
              borderRadius: "3px",
            }}
          >
            <span className="text-sm">{draggingBlock.icon}</span>
            <span>{draggingBlock.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
