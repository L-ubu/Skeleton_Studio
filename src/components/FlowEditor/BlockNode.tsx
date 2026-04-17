import { BLOCK_DEFINITIONS, type BlockInstance } from "../../types/blocks";
import { useStore } from "../../store/useStore";

function getParamSummary(block: BlockInstance): string | null {
  const p = block.props;
  const parts: string[] = [];

  if (p.keys) parts.push(p.keys);
  else if (p.command) parts.push(p.command.length > 20 ? p.command.slice(0, 20) + "..." : p.command);
  else if (p.title) parts.push(p.title);
  else if (p.path) parts.push(p.path.split("/").pop() || p.path);

  if (p.hand && p.hand !== "any") parts.push(p.hand);
  if (p.button) parts.push(p.button + " click");
  if (p.dwell_ms && p.dwell_ms !== 400) parts.push(p.dwell_ms + "ms");
  if (p.duration_ms) parts.push(p.duration_ms + "ms");
  if (p.count && p.count > 1) parts.push(p.count + "x");

  return parts.length > 0 ? parts.join(" · ") : null;
}

function needsConfig(block: BlockInstance): boolean {
  const p = block.props;
  // Show a hint dot if required fields are empty
  if (p.keys === "") return true;
  if (p.command === "") return true;
  if (p.path === "") return true;
  if (p.title === "" && p.body === "") return true;
  return false;
}

export default function BlockNode({ block, chainId }: { block: BlockInstance; chainId: string }) {
  const { selectedBlockId, selectBlock, removeBlockFromChain } = useStore();
  const def = BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId);
  if (!def) return null;

  const isSelected = selectedBlockId === block.id;
  const summary = getParamSummary(block);
  const incomplete = needsConfig(block);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); selectBlock(chainId, block.id); }}
      className={`relative flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer transition-all duration-200 border ${
        isSelected
          ? "scale-[1.04] shadow-lg"
          : "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
      }`}
      style={{
        backgroundColor: def.color + "12",
        borderColor: isSelected ? def.color : def.color + "30",
        color: def.color,
        boxShadow: isSelected ? `0 0 16px ${def.color}25` : undefined,
        borderRadius: "3px",
      }}
    >
      <span className="text-sm">{def.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[11px]">{def.label}</span>
          {incomplete && (
            <span className="w-1.5 h-1.5 bg-orange-400 flex-shrink-0 animate-pulse" style={{ borderRadius: "1px" }} title="Needs configuration" />
          )}
        </div>
        {summary ? (
          <div className="text-[8px] opacity-60 truncate max-w-32 mt-0.5 font-mono">{summary}</div>
        ) : incomplete ? (
          <div className="text-[8px] opacity-30 italic mt-0.5">configure</div>
        ) : null}
      </div>
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); removeBlockFromChain(chainId, block.id); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500/90 text-white text-[8px] flex items-center justify-center hover:bg-red-400 transition-all duration-150 hover:scale-110 animate-scale-in"
          style={{ borderRadius: "2px" }}
        >
          x
        </button>
      )}
    </div>
  );
}
