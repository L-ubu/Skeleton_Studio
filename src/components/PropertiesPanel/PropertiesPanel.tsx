import { useStore } from "../../store/useStore";
import { BLOCK_DEFINITIONS } from "../../types/blocks";

export default function PropertiesPanel() {
  const { chains, selectedChainId, selectedBlockId, updateBlockProps } = useStore();

  const chain = chains.find((c) => c.id === selectedChainId);
  const block = chain?.blocks.find((b) => b.id === selectedBlockId);
  const def = block ? BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId) : null;

  if (!block || !def) {
    return (
      <div className="p-4 text-xs text-gray-600 italic">
        Select a block to edit its properties
      </div>
    );
  }

  const update = (key: string, value: any) => {
    updateBlockProps(selectedChainId!, selectedBlockId!, { [key]: value });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span>{def.icon}</span>
        <h3 className="text-sm font-bold" style={{ color: def.color }}>{def.label}</h3>
      </div>

      {Object.entries(block.props).map(([key, value]) => (
        <div key={key}>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{key.replace(/_/g, " ")}</label>
          {key === "hand" ? (
            <select
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            >
              <option value="any">Any</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          ) : key === "button" ? (
            <select
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
            </select>
          ) : typeof value === "number" ? (
            <input
              type="number"
              value={value}
              onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            />
          ) : typeof value === "boolean" ? (
            <button
              onClick={() => update(key, !value)}
              className={`px-3 py-1 rounded text-xs ${value ? "bg-green-600" : "bg-[#1a1a3a] border border-[#333]"}`}
            >
              {value ? "On" : "Off"}
            </button>
          ) : (
            <input
              type="text"
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              placeholder={key === "keys" ? "e.g. cmd+shift+3" : key === "command" ? "e.g. open -a Safari" : ""}
              className="w-full bg-[#1a1a3a] border border-[#333] rounded px-2 py-1 text-xs text-white outline-none focus:border-green-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}
