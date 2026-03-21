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
