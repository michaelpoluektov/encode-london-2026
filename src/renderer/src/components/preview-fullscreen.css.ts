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
  gap: themeVars.space[3],
  padding: themeVars.space[4],
  pointerEvents: "none",
});

export const modelSelect = style({
  pointerEvents: "all",
  appearance: "none",
  background: "rgba(31, 32, 32, 0.82)",
  backdropFilter: "blur(20px)",
  border: `1px solid ${themeVars.color.border.strong}`,
  borderRadius: "3px",
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  padding: `${themeVars.space[2]} 26px ${themeVars.space[2]} ${themeVars.space[3]}`,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%237d7983'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  selectors: {
    "&:hover": {
      color: themeVars.color.text.primary,
      borderColor: themeVars.color.border.accent,
    },
    "&:focus": {
      outline: "none",
    },
  },
});

export const closeButton = style({
  pointerEvents: "all",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  border: "none",
  background: "rgba(38, 38, 38, 0.7)",
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.md,
  cursor: "pointer",
  backdropFilter: "blur(20px)",
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
  background: "rgba(38, 38, 38, 0.7)",
  padding: `${themeVars.space[2]} ${themeVars.space[4]}`,
  backdropFilter: "blur(6px)",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  border: "none",
});
