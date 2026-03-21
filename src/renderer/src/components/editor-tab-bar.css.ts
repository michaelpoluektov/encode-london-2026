import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const tabBar = style({
  display: "flex",
  alignItems: "stretch",
  overflowX: "auto",
  overflowY: "hidden",
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelInset,
  minHeight: "30px",
  flexShrink: 0,
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const tab = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
  padding: `0 ${themeVars.space[4]}`,
  borderRight: `1px solid ${themeVars.color.border.subtle}`,
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
      background: themeVars.color.surface.interactive,
      color: themeVars.color.text.secondary,
    },
  },
});

export const tabActive = style({
  background: themeVars.color.background.panel,
  color: themeVars.color.text.primary,
  borderBottom: `2px solid ${themeVars.color.surface.accent}`,
  selectors: {
    "&:hover": {
      background: themeVars.color.background.panel,
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
  fontSize: "10px",
  color: themeVars.color.surface.warning,
  flexShrink: 0,
  lineHeight: 1,
});

export const tabClose = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "14px",
  height: "14px",
  borderRadius: themeVars.radius.sm,
  border: "none",
  background: "transparent",
  color: themeVars.color.text.muted,
  fontSize: "10px",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
  lineHeight: 1,
  selectors: {
    "&:hover": {
      background: themeVars.color.surface.interactiveHover,
      color: themeVars.color.text.primary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
  },
});
