import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const floatingPanel = style({
  position: "absolute",
  width: "340px",
  height: "220px",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: themeVars.shadow.panel,
  background: themeVars.color.background.canvas,
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
  borderBottom: "none",
  color: themeVars.color.text.muted,
  background: "rgba(38, 38, 38, 0.62)",
  backdropFilter: "blur(20px)",
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
  fontSize: themeVars.font.size.sm,
});

export const expandButton = style({
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  border: "none",
  background: "transparent",
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
  fontSize: themeVars.font.size.md,
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

export const modelSelector = style({
  display: "inline-flex",
  gap: themeVars.space[1],
  marginLeft: themeVars.space[2],
});

export const modelButton = styleVariants({
  active: {
    color: themeVars.color.text.primary,
    opacity: 1,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: themeVars.font.size.xs,
    fontFamily: themeVars.font.family.mono,
    padding: `0 ${themeVars.space[1]}`,
    lineHeight: "1",
  },
  inactive: {
    color: themeVars.color.text.muted,
    opacity: 0.55,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: themeVars.font.size.xs,
    fontFamily: themeVars.font.family.mono,
    padding: `0 ${themeVars.space[1]}`,
    lineHeight: "1",
    selectors: {
      "&:hover": {
        opacity: 0.85,
      },
    },
  },
});
