import { create } from "zustand";
import { Chain, BlockInstance, LayoutMode, EngineStatus, BLOCK_DEFINITIONS } from "../types/blocks";

let chainCounter = 0;
let blockCounter = 0;
const nextChainId = () => `chain_${++chainCounter}`;
const nextBlockId = () => `block_${++blockCounter}`;

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
  engineStatus: EngineStatus;
  setEngineStatus: (status: Partial<EngineStatus>) => void;
  currentFrame: string | null;
  setCurrentFrame: (b64: string) => void;
}

export const useStore = create<StudioState>((set) => ({
  layout: "scratch",
  setLayout: (mode) => set({ layout: mode }),

  chains: [],
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

  engineStatus: { running: false, enabled: false, fps: 0, hands: 0, currentGesture: null, confidence: 0 },
  setEngineStatus: (status) =>
    set((s) => ({ engineStatus: { ...s.engineStatus, ...status } })),

  currentFrame: null,
  setCurrentFrame: (b64) => set({ currentFrame: b64 }),
}));
