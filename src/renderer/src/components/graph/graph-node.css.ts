import { style } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const graphNodeRoot = style({
  position: "relative",
  width: "100%",
  overflow: "visible",
});

export const graphNodeCard = style({
  position: "relative",
  display: "grid",
  gap: themeVars.space[4],
  minWidth: 0,
  padding: themeVars.space[5],
  borderRadius: themeVars.radius.xl,
  border: `1px solid ${themeVars.color.border.standard}`,
  background: themeVars.color.background.panelRaised,
  boxShadow: themeVars.shadow.panel,
});

export const graphNodeHeader = style({
  display: "grid",
  gap: themeVars.space[1],
  minWidth: 0,
});

export const graphNodeDetails = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeDetailRow = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: themeVars.space[2],
  alignItems: "baseline",
  minWidth: 0,
});

export const graphNodeInputs = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeInputRow = style({
  position: "relative",
  minHeight: themeVars.size.controlSm,
  minWidth: 0,
  paddingLeft: themeVars.space[7],
  display: "flex",
  alignItems: "center",
  borderRadius: themeVars.radius.md,
  background: themeVars.color.background.panelInset,
  border: `1px solid ${themeVars.color.border.subtle}`,
});

export const graphNodeInputHandle = style({
  position: "absolute",
  top: "50%",
  left: 0,
  transform: "translate(-50%, -50%)",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: `2px solid ${themeVars.color.background.panelRaised}`,
  background: themeVars.color.border.accent,
});

export const graphNodeOutputHandle = style({
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translate(50%, -50%)",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: `2px solid ${themeVars.color.background.panelRaised}`,
  background: themeVars.color.border.accent,
});

export const graphNodePreviewSlot = style({
  position: "absolute",
  top: `calc(100% + ${themeVars.space[3]})`,
  left: 0,
  right: 0,
  zIndex: 1,
});
