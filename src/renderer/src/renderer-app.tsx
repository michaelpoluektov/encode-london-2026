import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { darkThemeClass, themeRoot } from "./theme";

const getRootElement = (): HTMLElement => {
  const rootElement = document.getElementById("root");

  if (rootElement === null) {
    throw new Error("Renderer root element '#root' was not found.");
  }

  return rootElement;
};

ReactDOM.createRoot(getRootElement()).render(
  <React.StrictMode>
    <div className={[darkThemeClass, themeRoot].join(" ")}>
      <App />
    </div>
  </React.StrictMode>,
);
