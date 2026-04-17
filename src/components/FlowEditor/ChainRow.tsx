import { useStore } from "../../store/useStore";
import { useDroppable } from "@dnd-kit/core";
import BlockNode from "./BlockNode";

export default function ChainRow({ chainId }: { chainId: string }) {
  const { chains, selectedChainId, lastFiredGesture, selectBlock, clearSelection, toggleChain, removeChain, renameChain } = useStore();
  const chain = chains.find((c) => c.id === chainId);

  const { setNodeRef, isOver } = useDroppable({
    id: `chain-${chainId}`,
    data: { chainId },
  });

  if (!chain) return null;

  const isSelected = selectedChainId === chainId;
  const triggerBlock = chain.blocks[0];
  const isFiring = lastFiredGesture && triggerBlock && triggerBlock.definitionId === lastFiredGesture.split(":")[0];

  return (
    <div
      ref={setNodeRef}
      onClick={() => { clearSelection(); selectBlock(chainId, ""); }}
      className={`group p-4 border-l-[3px] bg-[#0b0b1e] transition-all duration-300 animate-fade-in-up ${
        isFiring ? "border-l-green-400 bg-[#0a1a15] shadow-[inset_0_0_40px_#00ff8815,0_0_16px_#00ff8810]"
        : isOver ? "border-l-green-400 bg-[#0c1a28] shadow-[inset_0_0_30px_#00ff8808]"
        : isSelected ? "border-l-green-400/50 bg-[#0d0d24]"
        : "border-l-[#1a1a30] hover:border-l-[#333]"
      } ${chain.enabled ? "opacity-100" : "opacity-40"}`}
    >
      {/* Chain header */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={(e) => { e.stopPropagation(); toggleChain(chainId); }}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            chain.enabled ? "bg-green-400 shadow-[0_0_8px_#00ff88] scale-100" : "bg-gray-700 scale-90"
          }`}
        />
        <input
          value={chain.name}
          onChange={(e) => renameChain(chainId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-xs text-gray-400 font-semibold outline-none border-b border-transparent focus:border-green-400/40 flex-1 transition-all duration-200 tracking-wide"
        />
        <button
          onClick={(e) => { e.stopPropagation(); removeChain(chainId); }}
          className="text-gray-700 hover:text-red-400 text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-200 hover:tracking-[0.15em]"
        >
          remove
        </button>
      </div>

      {/* Block flow */}
      {chain.blocks.length === 0 ? (
        <div className={`flex items-center gap-2 py-3 px-4 border border-dashed transition-all duration-300 ${
          isOver ? "border-green-400/50 text-green-400/70 bg-green-400/5" : "border-[#222] text-gray-700"
        }`}>
          <span className="text-xs font-mono">{isOver ? "+" : "~"}</span>
          <span className="text-[10px] tracking-wide">
            {isOver ? "Drop here" : "Drag a block here to start"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-0 flex-wrap">
          {chain.blocks.map((block, i) => (
            <div key={block.id} className="flex items-center animate-scale-in" style={{ animationDelay: `${i * 30}ms` }}>
              {i > 0 && (
                <svg width="28" height="12" viewBox="0 0 28 12" className="mx-0.5 flex-shrink-0">
                  <line x1="0" y1="6" x2="20" y2="6" stroke="#252540" strokeWidth="1.5" />
                  <polygon points="18,3 26,6 18,9" fill="#333" />
                </svg>
              )}
              <BlockNode block={block} chainId={chainId} />
            </div>
          ))}
          {isOver && (
            <div className="flex items-center animate-fade-in">
              <svg width="28" height="12" viewBox="0 0 28 12" className="mx-0.5">
                <line x1="0" y1="6" x2="20" y2="6" stroke="#00ff88" strokeWidth="1.5" strokeDasharray="3 3" />
                <polygon points="18,3 26,6 18,9" fill="#00ff88" />
              </svg>
              <span className="text-green-400 text-xs animate-pulse font-bold">+</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
