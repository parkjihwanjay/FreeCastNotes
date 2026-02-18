import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PreferencesApp from "./PreferencesApp";
import "./styles/globals.css";

const isPreferencesWindow =
  typeof window !== "undefined" && window.location.hash === "#preferences";

// Debugging helpers - log on startup
if (typeof window !== "undefined") {
  console.log("%c[FreeCastNotes] Debugging Tools Available", "color: #4CAF50; font-weight: bold; font-size: 14px;");
  console.log("%cTo debug image attachments:", "color: #2196F3; font-weight: bold;");
  console.log("  1. Open Developer Tools (Right-click → Inspect Element, or Cmd+Option+I)");
  console.log("  2. Go to Console tab");
  console.log("  3. Use: window.__debugAttachments('note-id')");
  console.log("  4. Check logs for image save/load operations");
  console.log("");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isPreferencesWindow ? <PreferencesApp /> : <App />}
  </React.StrictMode>,
);
