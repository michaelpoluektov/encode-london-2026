import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const panel = style({
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  background: `linear-gradient(180deg, ${themeVars.color.background.panelRaised} 0%, ${themeVars.color.background.panel} 100%)`,
  boxShadow: themeVars.shadow.panel,
  overflow: "hidden",
});

export const panelBody = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});
