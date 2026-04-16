import { useStore } from "../../store/useStore";
import BlockNode from "./BlockNode";

export default function ChainRow({ chainId }: { chainId: string }) {
  const { chains, selectedChainId, selectBlock, clearSelection, toggleChain, removeChain, renameChain } = useStore();
  const chain = chains.find((c) => c.id === chainId);
  if (!chain) return null;

  const isSelected = selectedChainId === chainId;

  return (
    <div
      onClick={() => { clearSelection(); selectBlock(chainId, ""); }}
      className={`p-3 rounded-xl border transition-colors ${
        isSelected ? "border-green-400/40 bg-[#0d0d2a]" : "border-[#222] bg-[#0a0a1a] hover:border-[#333]"
      }`}
    >
      {/* Chain header */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleChain(chainId); }}
          className={`w-3 h-3 rounded-full border ${chain.enabled ? "bg-green-400 border-green-400" : "bg-transparent border-gray-500"}`}
        />
        <input
          value={chain.name}
          onChange={(e) => renameChain(chainId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-xs text-gray-300 font-medium outline-none border-b border-transparent focus:border-gray-500 flex-1"
        />
        <button
          onClick={(e) => { e.stopPropagation(); removeChain(chainId); }}
          className="text-gray-600 hover:text-red-400 text-xs"
        >
          delete
        </button>
      </div>

      {/* Block chain */}
      {chain.blocks.length === 0 ? (
        <p className="text-[10px] text-gray-600 italic pl-5">Click blocks in palette to add</p>
      ) : (
        <div className="flex items-center gap-1 flex-wrap pl-5">
          {chain.blocks.map((block, i) => (
            <div key={block.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600 text-xs">→</span>}
              <BlockNode block={block} chainId={chainId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
