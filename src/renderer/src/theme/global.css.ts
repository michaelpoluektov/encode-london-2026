import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./contract.css";

export const themeRoot = style({
  minHeight: "100vh",
  background: [
    `radial-gradient(circle at top, ${themeVars.color.background.heroGlow} 0%, transparent 42%)`,
    `linear-gradient(180deg, #0d1324 0%, ${themeVars.color.background.app} 100%)`,
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
  backgroundColor: themeVars.color.background.app,
  colorScheme: "dark",
});

globalStyle("body", {
  margin: 0,
  minHeight: "100vh",
  background: "transparent",
  color: themeVars.color.text.primary,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
});

globalStyle("#root", {
  minHeight: "100vh",
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("button, input, textarea, select", {
  font: "inherit",
  color: "inherit",
});

globalStyle("button", {
  cursor: "pointer",
});

globalStyle("h1, h2, h3, h4, h5, h6, p", {
  margin: 0,
});

globalStyle("::selection", {
  background: themeVars.color.editor.selection,
  color: themeVars.color.text.primary,
});
