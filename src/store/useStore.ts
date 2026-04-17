import { create } from "zustand";
import { Chain, BlockInstance, LayoutMode, EngineStatus, BLOCK_DEFINITIONS } from "../types/blocks";

let chainCounter = 0;
let blockCounter = 0;
const nextChainId = () => `chain_${++chainCounter}`;
const nextBlockId = () => `block_${++blockCounter}`;

function makeBlock(definitionId: string, propsOverrides?: Record<string, any>): BlockInstance {
  const def = BLOCK_DEFINITIONS.find((d) => d.id === definitionId);
  return { id: nextBlockId(), definitionId, props: { ...def?.defaultProps, ...propsOverrides } };
}

function makeChain(name: string, blocks: BlockInstance[], enabled = true): Chain {
  return { id: nextChainId(), name, blocks, enabled };
}

function buildDefaultChains(): Chain[] {
  return [
    makeChain("Screenshot", [
      makeBlock("open_palm", { hand: "any", dwell_ms: 400, cooldown_ms: 2000 }),
      makeBlock("keypress", { keys: "cmd+shift+3" }),
    ]),
    makeChain("Close Tab", [
      makeBlock("fist", { hand: "any", dwell_ms: 400, cooldown_ms: 800 }),
      makeBlock("keypress", { keys: "cmd+w" }),
    ]),
    makeChain("Select All + Copy", [
      makeBlock("thumbs_up", { hand: "any", dwell_ms: 300, cooldown_ms: 500 }),
      makeBlock("keypress", { keys: "cmd+a" }),
      makeBlock("delay", { duration_ms: 100 }),
      makeBlock("keypress", { keys: "cmd+c" }),
    ]),
    makeChain("Switch App", [
      makeBlock("peace", { hand: "any", dwell_ms: 300, cooldown_ms: 500 }),
      makeBlock("keypress", { keys: "cmd+tab" }),
    ]),
    makeChain("Click", [
      makeBlock("point", { hand: "any", dwell_ms: 300, cooldown_ms: 500 }),
      makeBlock("mouse_click", { button: "left" }),
    ]),
    makeChain("Play / Pause", [
      makeBlock("rock", { hand: "any", dwell_ms: 300, cooldown_ms: 500 }),
      makeBlock("keypress", { keys: "space" }),
    ]),
    makeChain("Brightness (Left Pinch)", [
      makeBlock("pinch_distance", { hand: "left", smoothing: 0.3, dead_zone: 0.03, activation_ms: 800 }),
      makeBlock("brightness", { update_interval_ms: 200, invert: false }),
    ]),
    makeChain("Volume (Right Pinch)", [
      makeBlock("pinch_distance", { hand: "right", smoothing: 0.3, dead_zone: 0.03, activation_ms: 800 }),
      makeBlock("volume", { update_interval_ms: 200, invert: false }),
    ]),
  ];
}

interface StudioState {
  layout: LayoutMode;
  setLayout: (mode: LayoutMode) => void;
  chains: Chain[];
  addChain: () => void;
  removeChain: (chainId: string) => void;
  toggleChain: (chainId: string) => void;
  renameChain: (chainId: string, name: string) => void;
  addBlockToChain: (chainId: string, definitionId: string) => void;
  removeBlockFromChain: (chainId: string, blockId: string) => void;
  updateBlockProps: (chainId: string, blockId: string, props: Record<string, any>) => void;
  selectedChainId: string | null;
  selectedBlockId: string | null;
  selectBlock: (chainId: string, blockId: string) => void;
  clearSelection: () => void;
  engineStarting: boolean;
  setEngineStarting: (v: boolean) => void;
  engineStatus: EngineStatus;
  setEngineStatus: (status: Partial<EngineStatus>) => void;
  lastFiredGesture: string | null;
  setLastFiredGesture: (gesture: string | null) => void;
  currentFrame: string | null;
  setCurrentFrame: (b64: string) => void;
  saveProject: () => void;
  loadProject: () => void;
}

export const useStore = create<StudioState>((set) => ({
  layout: "scratch",
  setLayout: (mode) => set({ layout: mode }),

  chains: buildDefaultChains(),
  addChain: () =>
    set((s) => ({
      chains: [...s.chains, { id: nextChainId(), blocks: [], enabled: true, name: "New Automation" }],
    })),
  removeChain: (chainId) =>
    set((s) => ({ chains: s.chains.filter((c) => c.id !== chainId) })),
  toggleChain: (chainId) =>
    set((s) => ({
      chains: s.chains.map((c) => (c.id === chainId ? { ...c, enabled: !c.enabled } : c)),
    })),
  renameChain: (chainId, name) =>
    set((s) => ({
      chains: s.chains.map((c) => (c.id === chainId ? { ...c, name } : c)),
    })),
  addBlockToChain: (chainId, definitionId) => {
    const def = BLOCK_DEFINITIONS.find((d) => d.id === definitionId);
    if (!def) return;
    const block: BlockInstance = { id: nextBlockId(), definitionId, props: { ...def.defaultProps } };
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId ? { ...c, blocks: [...c.blocks, block] } : c
      ),
    }));
  },
  removeBlockFromChain: (chainId, blockId) =>
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId ? { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) } : c
      ),
    })),
  updateBlockProps: (chainId, blockId, props) =>
    set((s) => ({
      chains: s.chains.map((c) =>
        c.id === chainId
          ? { ...c, blocks: c.blocks.map((b) => (b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b)) }
          : c
      ),
    })),

  selectedChainId: null,
  selectedBlockId: null,
  selectBlock: (chainId, blockId) => set({ selectedChainId: chainId, selectedBlockId: blockId }),
  clearSelection: () => set({ selectedChainId: null, selectedBlockId: null }),

  engineStarting: false,
  setEngineStarting: (v) => set({ engineStarting: v }),
  engineStatus: { running: false, enabled: false, fps: 0, hands: 0, currentGesture: null, confidence: 0 },
  setEngineStatus: (status) =>
    set((s) => ({ engineStatus: { ...s.engineStatus, ...status }, engineStarting: false })),

  lastFiredGesture: null,
  setLastFiredGesture: (gesture) => set({ lastFiredGesture: gesture }),

  currentFrame: null,
  setCurrentFrame: (b64) => set({ currentFrame: b64 }),

  saveProject: () => {
    const state = useStore.getState();
    const project = {
      name: "My Setup",
      version: 1,
      chains: state.chains,
      settings: { layout: state.layout },
    };
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skeleton-studio-project.json";
    a.click();
    URL.revokeObjectURL(url);
  },
  loadProject: () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const project = JSON.parse(ev.target?.result as string);
          useStore.setState({
            chains: project.chains || [],
            layout: project.settings?.layout || "scratch",
          });
        } catch (err) {
          console.error("Failed to load project:", err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },
}));
