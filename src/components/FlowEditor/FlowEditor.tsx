import { useStore } from "../../store/useStore";
import ChainRow from "./ChainRow";

export default function FlowEditor() {
  const { chains, addChain, clearSelection } = useStore();

  return (
    <div className="p-4 space-y-2 min-h-full" onClick={() => clearSelection()}>
      {chains.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600 animate-fade-in">
          <div className="text-3xl mb-3 opacity-20 font-mono">~/</div>
          <p className="text-sm mb-1 text-gray-500">No automations yet</p>
          <p className="text-[10px] text-gray-700 mb-4 tracking-wide">Create a chain and drag blocks into it</p>
          <button
            onClick={addChain}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-all duration-200 hover:shadow-[0_0_16px_#00ff8825] active:scale-95"
          >
            + Create First Chain
          </button>
        </div>
      ) : (
        chains.map((chain) => <ChainRow key={chain.id} chainId={chain.id} />)
      )}
    </div>
  );
}
