import { useStore } from "../../store/useStore";
import ChainRow from "./ChainRow";

export default function FlowEditor() {
  const { chains, addChain, clearSelection } = useStore();

  return (
    <div className="p-4 space-y-3 min-h-full" onClick={() => clearSelection()}>
      {chains.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <p className="text-sm mb-2">No automations yet</p>
          <button onClick={addChain} className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium">
            + Create First Chain
          </button>
        </div>
      ) : (
        chains.map((chain) => <ChainRow key={chain.id} chainId={chain.id} />)
      )}
    </div>
  );
}
