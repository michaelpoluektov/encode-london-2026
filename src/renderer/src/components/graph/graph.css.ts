import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const graphCanvas = style({
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  background: themeVars.color.background.canvas,
  boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.14)",
});

export const graphViewportControls = style({
  display: "inline-flex",
  alignItems: "center",
  gap: themeVars.space[2],
  padding: themeVars.space[1],
  background: themeVars.color.surface.interactive,
  boxShadow: `inset 0 0 0 1px ${themeVars.color.border.standard}`,
});

export const graphDiagnosticPanel = style({
  position: "absolute",
  top: themeVars.space[4],
  left: themeVars.space[4],
  zIndex: 4,
  maxWidth: "min(560px, calc(100% - 32px))",
  display: "grid",
  gap: themeVars.space[2],
  padding: themeVars.space[3],
  borderRadius: "10px",
  background: "rgba(47, 16, 16, 0.94)",
  boxShadow: themeVars.shadow.panel,
  border: `1px solid ${themeVars.color.surface.danger}`,
});

export const graphDiagnosticPanelStale = style({
  background: "rgba(66, 44, 12, 0.94)",
  borderColor: themeVars.color.surface.warning,
});

export const graphDiagnosticMessage = style({
  margin: 0,
  maxHeight: "180px",
  overflow: "auto",
  whiteSpace: "pre-wrap",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
  color: themeVars.color.text.primary,
});

globalStyle(`${graphCanvas} .react-flow`, {
  width: "100%",
  height: "100%",
  background: themeVars.color.background.panelInset,
  color: themeVars.color.text.primary,
  vars: {
    "--xy-background-color": themeVars.color.background.panelInset,
    "--xy-background-pattern-dots-color": themeVars.color.border.subtle,
    "--xy-edge-stroke": themeVars.color.border.accent,
    "--xy-node-border": "none",
    "--xy-node-background-color": themeVars.color.background.panelRaised,
    "--xy-node-color": themeVars.color.text.primary,
    "--xy-node-boxshadow-hover": themeVars.shadow.panel,
    "--xy-node-boxshadow-selected": `0 0 0 1px ${themeVars.color.border.accent}`,
    "--xy-handle-background-color": themeVars.color.border.accent,
    "--xy-handle-border-color": themeVars.color.background.panelRaised,
  },
});

globalStyle(`${graphCanvas} .react-flow__node`, {
  overflow: "visible",
  userSelect: "none",
});

globalStyle(`${graphCanvas} .react-flow__viewport`, {
  userSelect: "none",
});

globalStyle(`${graphCanvas} .react-flow__panel`, {
  margin: themeVars.space[4],
});

globalStyle(`${graphCanvas} .react-flow__pane`, {
  cursor: "grab",
});

globalStyle(`${graphCanvas} .react-flow__pane.dragging`, {
  cursor: "grabbing",
});

globalStyle(`${graphCanvas} input`, {
  userSelect: "text",
});
