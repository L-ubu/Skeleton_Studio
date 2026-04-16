import { BLOCK_DEFINITIONS, type BlockInstance } from "../../types/blocks";
import { useStore } from "../../store/useStore";

export default function BlockNode({ block, chainId }: { block: BlockInstance; chainId: string }) {
  const { selectedBlockId, selectBlock, removeBlockFromChain } = useStore();
  const def = BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId);
  if (!def) return null;

  const isSelected = selectedBlockId === block.id;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectBlock(chainId, block.id); }}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
        isSelected ? "ring-2 ring-white/40 scale-105" : "hover:brightness-125"
      }`}
      style={{
        backgroundColor: def.color + "15",
        borderColor: def.color + "60",
        color: def.color,
      }}
    >
      <span>{def.icon}</span>
      <div>
        <div>{def.label}</div>
        {/* Show key prop preview */}
        {block.props.keys && <div className="text-[9px] opacity-60">{block.props.keys}</div>}
        {block.props.command && <div className="text-[9px] opacity-60 truncate max-w-20">{block.props.command}</div>}
        {block.props.hand && block.props.hand !== "any" && (
          <div className="text-[9px] opacity-60">{block.props.hand} hand</div>
        )}
      </div>
      {/* Remove button */}
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); removeBlockFromChain(chainId, block.id); }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center hover:bg-red-400"
        >
          x
        </button>
      )}
    </div>
  );
}
