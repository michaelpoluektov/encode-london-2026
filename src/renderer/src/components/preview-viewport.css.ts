import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const previewLayout = style({
  display: "grid",
  gridTemplateRows: "minmax(140px, 1fr) auto",
  gap: themeVars.space[4],
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});

export const diagnosticsCard = style({
  display: "grid",
  gap: themeVars.space[2],
  padding: themeVars.space[3],
  borderRadius: themeVars.radius.md,
  background: themeVars.color.background.overlay,
  border: `1px solid ${themeVars.color.border.subtle}`,
});

export const diagnosticsEyebrow = style({
  margin: 0,
  color: themeVars.color.text.muted,
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.medium,
  letterSpacing: themeVars.font.tracking.eyebrow,
  textTransform: "uppercase",
});

export const diagnosticsSummary = style({
  margin: 0,
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
});

export const diagnosticsDetail = style({
  margin: 0,
  maxHeight: "9rem",
  overflow: "auto",
  color: themeVars.color.text.primary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
  whiteSpace: "pre-wrap",
});
