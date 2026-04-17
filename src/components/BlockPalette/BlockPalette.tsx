import { BLOCK_DEFINITIONS, type BlockCategory } from "../../types/blocks";
import { useStore } from "../../store/useStore";
import { useDraggable } from "@dnd-kit/core";

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  hand_trigger: "Hand Triggers",
  continuous_trigger: "Continuous",
  action: "Actions",
  flow: "Flow Control",
  modifier: "Modifiers",
};

const CATEGORY_ORDER: BlockCategory[] = ["hand_trigger", "continuous_trigger", "action", "flow", "modifier"];

function DraggableBlock({ id, color, icon, label }: { id: string; color: string; icon: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${id}`,
    data: { definitionId: id },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30 scale-95" : "hover:bg-[#14142e] hover:translate-x-0.5 active:scale-[0.97]"
      }`}
      style={{ borderLeft: `3px solid ${color}40`, background: isDragging ? undefined : undefined }}
    >
      <span className="text-sm">{icon}</span>
      <span className="truncate" style={{ color }}>{label}</span>
    </button>
  );
}

export default function BlockPalette() {
  const { chains, selectedChainId, addChain, addBlockToChain, selectBlock } = useStore();

  const handleClick = (definitionId: string) => {
    let targetChain = selectedChainId;
    if (!targetChain) {
      if (chains.length > 0) {
        targetChain = chains[0].id;
        selectBlock(targetChain, "");
      } else {
        addChain();
        const state = useStore.getState();
        targetChain = state.chains[state.chains.length - 1].id;
        selectBlock(targetChain, "");
      }
    }
    addBlockToChain(targetChain, definitionId);
  };

  return (
    <div className="p-3 space-y-4">
      <p className="text-[9px] text-gray-600 uppercase tracking-wider">Drag or click to add</p>
      {CATEGORY_ORDER.map((cat, catIdx) => {
        const blocks = BLOCK_DEFINITIONS.filter((b) => b.category === cat);
        return (
          <div key={cat} className="animate-fade-in-up" style={{ animationDelay: `${catIdx * 40}ms` }}>
            <h3 className="text-[9px] uppercase tracking-widest text-gray-600 mb-1.5 px-1">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="space-y-0.5">
              {blocks.map((block) => (
                <div key={block.id} onClick={() => handleClick(block.id)}>
                  <DraggableBlock id={block.id} color={block.color} icon={block.icon} label={block.label} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
