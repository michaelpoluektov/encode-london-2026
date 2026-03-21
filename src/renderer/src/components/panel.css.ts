import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const panel = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: 0,
  background: themeVars.color.background.panelRaised,
  boxShadow: themeVars.shadow.panel,
  overflow: "hidden",
});

export const panelHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: themeVars.size.panelHeaderHeight,
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
});

export const panelHeaderControls = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[1],
});

export const panelBody = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});
