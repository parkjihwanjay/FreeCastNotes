import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PreferencesApp from "./PreferencesApp";
import "./styles/globals.css";

const isPreferencesWindow =
  typeof window !== "undefined" && window.location.hash === "#preferences";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isPreferencesWindow ? <PreferencesApp /> : <App />}
  </React.StrictMode>,
);
