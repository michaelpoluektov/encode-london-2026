import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./contract.css";

export const themeRoot = style({
  height: "100%",
  minHeight: 0,
  background: [
    "radial-gradient(circle at top right, rgba(74, 248, 227, 0.08) 0%, transparent 26%)",
    `radial-gradient(circle at top left, ${themeVars.color.background.heroGlow} 0%, transparent 34%)`,
    `linear-gradient(180deg, #141214 0%, ${themeVars.color.background.app} 100%)`,
  ].join(", "),
  color: themeVars.color.text.primary,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("html", {
  height: "100%",
  backgroundColor: themeVars.color.background.app,
  colorScheme: "dark",
});

globalStyle("body", {
  margin: 0,
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  background: "transparent",
  color: themeVars.color.text.primary,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
});

globalStyle("#root", {
  height: "100%",
  minHeight: 0,
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("button, input, textarea, select", {
  font: "inherit",
  color: "inherit",
});

globalStyle("h1, h2, h3, h4, h5, h6, p", {
  margin: 0,
});

globalStyle("::selection", {
  background: themeVars.color.editor.selection,
  color: themeVars.color.text.primary,
});

// Pre-seed Monaco's CSS variables so they resolve even if theme injection fails
globalStyle(":root", {
  vars: {
    "--vscode-scrollbarSlider-background": "rgba(199, 153, 255, 0.18)",
    "--vscode-scrollbarSlider-hoverBackground": "rgba(199, 153, 255, 0.28)",
    "--vscode-scrollbarSlider-activeBackground": "rgba(199, 153, 255, 0.36)",
    "--vscode-scrollbar-shadow": "#131313",
    "--vscode-editorOverviewRuler-background": "#131313",
    "--vscode-editorOverviewRuler-border": "#00000000",
    "--vscode-editor-selectionBackground": "rgba(199, 153, 255, 0.2)",
    "--vscode-editor-inactiveSelectionBackground": "rgba(199, 153, 255, 0.1)",
  },
});

globalStyle(".monaco-editor .selected-text", {
  background: "rgba(199, 153, 255, 0.2) !important" as string,
});

globalStyle(".monaco-scrollable-element > .scrollbar", {
  background: "transparent !important" as string,
});

globalStyle(".monaco-scrollable-element > .scrollbar > .slider", {
  background: "rgba(199, 153, 255, 0.18) !important" as string,
  borderRadius: "0",
});

globalStyle(".monaco-scrollable-element > .scrollbar > .slider:hover", {
  background: "rgba(199, 153, 255, 0.28) !important" as string,
});

globalStyle(".monaco-scrollable-element > .scrollbar > .slider.active", {
  background: "rgba(199, 153, 255, 0.36) !important" as string,
});
