import { useEffect, useState } from "react";
import { bridge } from "./lib/bridge";
import PreferencesPanel from "./components/PreferencesPanel/PreferencesPanel";

export default function PreferencesApp() {
  const [globalShortcut, setGlobalShortcut] = useState("Alt+N");

  useEffect(() => {
    bridge
      .getGlobalShortcut()
      .then((shortcut) => {
        if (shortcut) setGlobalShortcut(shortcut);
      })
      .catch((err) => console.error("Failed to load global shortcut", err));
  }, []);

  const handleSaveShortcut = async (shortcut: string) => {
    await bridge.setGlobalShortcut(shortcut);
    setGlobalShortcut(shortcut);
  };

  const handleClose = () => {
    bridge.hideWindow();
  };

  return (
    <div className="h-screen overflow-y-auto bg-[#2C2C2E] p-6 flex justify-center">
      <PreferencesPanel
        open={true}
        standalone={true}
        currentShortcut={globalShortcut}
        onClose={handleClose}
        onSaveShortcut={handleSaveShortcut}
      />
    </div>
  );
}
