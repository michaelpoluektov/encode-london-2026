import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const workspaceRegionHeader = style({
  alignItems: "center",
  flexWrap: "nowrap",
});

export const workspaceRegionActions = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: themeVars.space[2],
  justifyContent: "flex-end",
  minWidth: 0,
  flexShrink: 0,
});

export const workspaceRegionSelect = style({
  minWidth: "4.75rem",
  height: "28px",
  padding: `0 ${themeVars.space[3]}`,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.background.canvas,
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  textTransform: "none",
});

export const workspaceRegionButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  padding: 0,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.background.canvas,
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: "1",
  selectors: {
    "&:hover": {
      borderColor: themeVars.color.border.strong,
      color: themeVars.color.text.primary,
    },
  },
});

export const workspaceRegionTabs = style({
  display: "flex",
  alignItems: "stretch",
  gap: themeVars.space[2],
  padding: `${themeVars.space[2]} ${themeVars.space[5]}`,
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelMuted,
  overflowX: "auto",
});

export const workspaceRegionTab = style({
  padding: `${themeVars.space[2]} ${themeVars.space[4]}`,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.regular,
  letterSpacing: 0,
  textTransform: "none",
  whiteSpace: "nowrap",
  selectors: {
    "&:hover": {
      background: themeVars.color.background.panel,
      color: themeVars.color.text.primary,
    },
  },
});

export const workspaceRegionTabActive = style({
  background: themeVars.color.background.panel,
  boxShadow: `inset 0 1px 0 ${themeVars.color.border.accent}`,
  color: themeVars.color.text.primary,
});

export const workspaceRegionBody = styleVariants({
  single: {
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr)",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },
  tabbed: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },
});

export const workspaceRegionEmpty = style({
  display: "grid",
  alignItems: "center",
  justifyItems: "center",
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[5],
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  textTransform: "uppercase",
});
