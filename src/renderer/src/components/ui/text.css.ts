import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const text = style({
  minWidth: 0,
});

export const textVariant = styleVariants({
  body: {
    color: themeVars.color.text.body,
    fontSize: themeVars.font.size.sm,
    lineHeight: themeVars.font.lineHeight.relaxed,
  },
  caption: {
    color: themeVars.color.text.secondary,
    fontSize: themeVars.font.size.xs,
    lineHeight: themeVars.font.lineHeight.normal,
  },
  code: {
    color: themeVars.color.text.code,
    fontFamily: themeVars.font.family.mono,
    fontSize: themeVars.font.size.xs,
    lineHeight: themeVars.font.lineHeight.normal,
  },
  label: {
    color: themeVars.color.text.label,
    fontFamily: themeVars.font.family.mono,
    fontSize: themeVars.font.size.xs,
    fontWeight: themeVars.font.weight.medium,
    letterSpacing: themeVars.font.tracking.eyebrow,
    lineHeight: themeVars.font.lineHeight.normal,
    textTransform: "uppercase",
  },
  title: {
    color: themeVars.color.text.heading,
    fontSize: themeVars.font.size.md,
    fontWeight: themeVars.font.weight.medium,
    lineHeight: themeVars.font.lineHeight.tight,
  },
});

export const textTone = styleVariants({
  accent: {
    color: themeVars.color.text.accent,
  },
  default: {
    color: themeVars.color.text.primary,
  },
  muted: {
    color: themeVars.color.text.muted,
  },
  secondary: {
    color: themeVars.color.text.secondary,
  },
});
