import Toolbar from "./components/Toolbar/Toolbar";
import Editor from "./components/Editor/Editor";

function App() {
  return (
    <div className="flex h-screen flex-col bg-[#1C1C1E]">
      <Toolbar />
      <Editor />
    </div>
  );
}

export default App;
