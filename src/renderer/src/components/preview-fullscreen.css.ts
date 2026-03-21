import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const overlay = style({
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(6, 9, 14, 0.94)",
  display: "flex",
  flexDirection: "column",
});

export const sceneHost = style({
  position: "absolute",
  inset: 0,
});

export const topBar = style({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: themeVars.space[4],
  pointerEvents: "none",
});

export const closeButton = style({
  pointerEvents: "all",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.sm,
  background: "rgba(12, 17, 26, 0.72)",
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.sm,
  cursor: "pointer",
  backdropFilter: "blur(8px)",
  selectors: {
    "&:hover": {
      color: themeVars.color.text.primary,
      background: "rgba(24, 34, 50, 0.88)",
      borderColor: themeVars.color.border.strong,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
  },
});

export const hint = style({
  position: "absolute",
  bottom: themeVars.space[5],
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 1,
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  letterSpacing: "0.04em",
  background: "rgba(6, 9, 14, 0.6)",
  padding: `${themeVars.space[2]} ${themeVars.space[4]}`,
  borderRadius: themeVars.radius.pill,
  backdropFilter: "blur(6px)",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  border: `1px solid ${themeVars.color.border.subtle}`,
});
