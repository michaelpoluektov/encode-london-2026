import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const floatingPanel = style({
  position: "absolute",
  width: "340px",
  height: "220px",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: themeVars.radius.md,
  boxShadow: themeVars.shadow.panel,
  background: themeVars.color.background.panelRaised,
  border: `1px solid ${themeVars.color.border.subtle}`,
});

export const dragHandle = style({
  appearance: "none",
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
  width: "100%",
  height: "28px",
  flexShrink: 0,
  padding: `0 ${themeVars.space[2]} 0 ${themeVars.space[3]}`,
  cursor: "grab",
  userSelect: "none",
  border: 0,
  background: "transparent",
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  selectors: {
    "&:active": {
      cursor: "grabbing",
    },
  },
});

export const gripIcon = style({
  opacity: 0.4,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

export const expandButton = style({
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "18px",
  height: "18px",
  border: "none",
  background: "transparent",
  color: themeVars.color.text.muted,
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
  selectors: {
    "&:hover": {
      color: themeVars.color.text.primary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
  },
});

export const previewBody = style({
  flex: "1 1 0",
  minHeight: 0,
  position: "relative",
});
