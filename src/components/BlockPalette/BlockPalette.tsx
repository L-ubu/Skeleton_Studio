import { BLOCK_DEFINITIONS, type BlockCategory } from "../../types/blocks";
import { useStore } from "../../store/useStore";

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  hand_trigger: "Hand Triggers",
  continuous_trigger: "Continuous",
  action: "Actions",
  flow: "Flow Control",
  modifier: "Modifiers",
};

const CATEGORY_ORDER: BlockCategory[] = ["hand_trigger", "continuous_trigger", "action", "flow", "modifier"];

export default function BlockPalette() {
  const { selectedChainId, addBlockToChain } = useStore();

  const handleAdd = (definitionId: string) => {
    if (!selectedChainId) return;
    addBlockToChain(selectedChainId, definitionId);
  };

  return (
    <div className="p-3 space-y-4">
      {!selectedChainId && (
        <p className="text-xs text-gray-500 italic">Select a chain first, then click blocks to add</p>
      )}
      {CATEGORY_ORDER.map((cat) => {
        const blocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
        return (
          <div key={cat}>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="space-y-1">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleAdd(block.id)}
                  disabled={!selectedChainId}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors hover:bg-[#1a1a3a] disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderLeft: `3px solid ${block.color}` }}
                >
                  <span>{block.icon}</span>
                  <span style={{ color: block.color }}>{block.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
