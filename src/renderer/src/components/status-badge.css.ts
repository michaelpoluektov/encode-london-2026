import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const statusBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: themeVars.space[2],
  minHeight: themeVars.size.controlMd,
  padding: `0 ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.pill,
  border: `1px solid ${themeVars.color.border.subtle}`,
});

export const statusTone = styleVariants({
  neutral: {
    background: themeVars.color.background.overlay,
    color: themeVars.color.text.secondary,
  },
  accent: {
    background: themeVars.color.surface.accentMuted,
    color: themeVars.color.text.accent,
    borderColor: themeVars.color.border.accent,
  },
  success: {
    background: themeVars.color.surface.successMuted,
    color: themeVars.color.surface.success,
  },
  warning: {
    background: themeVars.color.surface.warningMuted,
    color: themeVars.color.surface.warning,
  },
});

export const statusLabel = style({
  color: themeVars.color.text.muted,
  fontSize: themeVars.font.size.xs,
  textTransform: "uppercase",
  letterSpacing: themeVars.font.tracking.eyebrow,
});
