import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const panel = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: 0,
  background: themeVars.color.background.panel,
  boxShadow: themeVars.shadow.panel,
  overflow: "hidden",
});

export const panelTone = styleVariants({
  default: {},
  muted: {
    background: themeVars.color.background.panelMuted,
  },
});

export const panelHeader = style({
  display: "flex",
  alignItems: "flex-start",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: themeVars.space[4],
  padding: `${themeVars.space[4]} ${themeVars.space[5]} ${themeVars.space[3]}`,
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
});

export const panelTitleBlock = style({
  display: "grid",
  gap: themeVars.space[1],
  minWidth: 0,
  flex: "1 1 12rem",
});

export const panelEyebrow = style({
  margin: 0,
  color: themeVars.color.text.muted,
  letterSpacing: "0.04em",
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.medium,
});

export const panelTitle = style({
  margin: 0,
  color: themeVars.color.text.primary,
  fontSize: themeVars.font.size.md,
  fontWeight: themeVars.font.weight.medium,
  lineHeight: themeVars.font.lineHeight.tight,
});

export const panelBody = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});
