import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const tabBar = style({
  display: "flex",
  alignItems: "stretch",
  overflowX: "auto",
  overflowY: "hidden",
  background: themeVars.color.background.panel,
  minHeight: "30px",
  flexShrink: 0,
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const tabBarSpacer = style({
  flex: 1,
  minWidth: 0,
});

export const tab = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
  padding: `0 ${themeVars.space[4]}`,
  background: "transparent",
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  whiteSpace: "nowrap",
  cursor: "pointer",
  userSelect: "none",
  flexShrink: 0,
  minWidth: 0,
  selectors: {
    "&:hover": {
      color: themeVars.color.text.secondary,
    },
  },
});

export const tabActive = style({
  color: themeVars.color.text.primary,
  boxShadow: "inset 0 2px 0 #c799ff",
  selectors: {
    "&:hover": {
      color: themeVars.color.text.primary,
    },
  },
});

export const tabLabel = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "160px",
  cursor: "pointer",
  background: "none",
  border: "none",
  padding: 0,
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
  selectors: {
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
  },
});

export const tabBell = style({
  color: themeVars.color.surface.warning,
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "12px",
  height: "12px",
  fontSize: themeVars.font.size.sm,
});

export const tabClose = style({
  display: "flex",
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
  fontSize: themeVars.font.size.sm,
  selectors: {
    "&:hover": {
      color: themeVars.color.surface.accent,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
  },
});
