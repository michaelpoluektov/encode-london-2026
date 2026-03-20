import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const panel = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.lg,
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
  justifyContent: "space-between",
  gap: themeVars.space[4],
  padding: `${themeVars.space[5]} ${themeVars.space[5]} ${themeVars.space[3]}`,
});

export const panelTitleBlock = style({
  display: "grid",
  gap: themeVars.space[1],
});

export const panelEyebrow = style({
  margin: 0,
  color: themeVars.color.text.muted,
  textTransform: "uppercase",
  letterSpacing: themeVars.font.tracking.eyebrow,
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.medium,
});

export const panelTitle = style({
  margin: 0,
  color: themeVars.color.text.primary,
  fontSize: themeVars.font.size.xl,
  fontWeight: themeVars.font.weight.strong,
  lineHeight: themeVars.font.lineHeight.tight,
});

export const panelBody = style({
  height: "100%",
  minHeight: 0,
});
