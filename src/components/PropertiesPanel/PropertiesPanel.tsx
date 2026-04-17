import { useStore } from "../../store/useStore";
import { BLOCK_DEFINITIONS } from "../../types/blocks";

const inputClass = "w-full bg-[#0e0e22] border border-[#222240] px-2.5 py-1.5 text-xs text-white outline-none focus:border-green-400/50 transition-all duration-200 focus:shadow-[0_0_8px_#00ff8810]";

export default function PropertiesPanel() {
  const { chains, selectedChainId, selectedBlockId, updateBlockProps } = useStore();

  const chain = chains.find((c) => c.id === selectedChainId);
  const block = chain?.blocks.find((b) => b.id === selectedBlockId);
  const def = block ? BLOCK_DEFINITIONS.find((d) => d.id === block.definitionId) : null;

  if (!block || !def) {
    return (
      <div className="h-full flex items-center justify-center p-4 animate-fade-in">
        <p className="text-[10px] text-gray-700 text-center tracking-wide">Select a block to<br/>edit its properties</p>
      </div>
    );
  }

  const update = (key: string, value: any) => {
    updateBlockProps(selectedChainId!, selectedBlockId!, { [key]: value });
  };

  return (
    <div className="p-4 space-y-3 animate-slide-in-right">
      {/* Block header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#1a1a30]">
        <span className="text-base">{def.icon}</span>
        <div>
          <h3 className="text-xs font-bold tracking-wide" style={{ color: def.color }}>{def.label}</h3>
          <span className="text-[8px] text-gray-600 uppercase tracking-widest">{def.category.replace("_", " ")}</span>
        </div>
      </div>

      {Object.entries(block.props).map(([key, value], idx) => (
        <div key={key} className="animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
          <label className="text-[9px] uppercase tracking-widest text-gray-600 block mb-1.5">
            {key.replace(/_/g, " ")}
          </label>
          {key === "hand" ? (
            <select value={value as string} onChange={(e) => update(key, e.target.value)} className={inputClass}>
              <option value="any">Any</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          ) : key === "button" ? (
            <select value={value as string} onChange={(e) => update(key, e.target.value)} className={inputClass}>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="middle">Middle</option>
            </select>
          ) : key === "direction" ? (
            <select value={value as string} onChange={(e) => update(key, e.target.value)} className={inputClass}>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          ) : typeof value === "number" ? (
            <input
              type="number"
              value={value}
              onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
              className={inputClass + " tabular-nums"}
            />
          ) : typeof value === "boolean" ? (
            <button
              onClick={() => update(key, !value)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                value
                  ? "bg-green-600/90 text-white shadow-[0_0_8px_#00ff8820]"
                  : "bg-[#0e0e22] border border-[#222240] text-gray-500 hover:text-gray-300"
              }`}
            >
              {value ? "On" : "Off"}
            </button>
          ) : (
            <input
              type="text"
              value={value as string}
              onChange={(e) => update(key, e.target.value)}
              placeholder={key === "keys" ? "e.g. cmd+shift+3" : key === "command" ? "e.g. open -a Safari" : ""}
              className={inputClass + " placeholder:text-gray-700/50"}
            />
          )}
        </div>
      ))}
    </div>
  );
}
