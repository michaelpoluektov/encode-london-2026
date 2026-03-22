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

export const modelSelect = style({
  marginLeft: themeVars.space[2],
  appearance: "none",
  background: themeVars.color.background.panelRaised,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: "3px",
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  padding: `1px 22px 1px ${themeVars.space[2]}`,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%237d7983'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 6px center",
  selectors: {
    "&:hover": {
      color: themeVars.color.text.primary,
      borderColor: themeVars.color.border.strong,
    },
    "&:focus": {
      outline: "none",
    },
  },
});
