import Toolbar from "./components/Toolbar/Toolbar";
import Editor from "./components/Editor/Editor";
import FormatBar from "./components/Editor/FormatBar";
import { useAppEditor } from "./hooks/useEditor";

function App() {
  const editor = useAppEditor();

  return (
    <div className="flex h-screen flex-col bg-[#1C1C1E]">
      <Toolbar />
      <Editor editor={editor} />
      <FormatBar editor={editor} />
    </div>
  );
}

export default App;
