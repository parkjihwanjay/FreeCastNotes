import Toolbar from "./components/Toolbar/Toolbar";

function App() {
  return (
    <div className="flex h-screen flex-col bg-[#1C1C1E]">
      <Toolbar />
      {/* Editor area — placeholder until TipTap is added */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#E5E5E7]/40">Start writing...</p>
      </div>
    </div>
  );
}

export default App;
