import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const buttonBase = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  borderRadius: themeVars.radius.sm,
  border: `1px solid transparent`,
  background: "transparent",
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.regular,
  lineHeight: "1",
  transition: [
    `background ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:focus-visible": {
      boxShadow: themeVars.shadow.focus,
      outline: "none",
    },
    "&:disabled": {
      cursor: "default",
      opacity: 0.5,
    },
  },
});

export const buttonSize = styleVariants({
  md: {
    height: themeVars.size.controlMd,
    padding: `0 ${themeVars.space[4]}`,
  },
  sm: {
    height: themeVars.size.controlSm,
    padding: `0 ${themeVars.space[3]}`,
  },
});

export const buttonVariant = styleVariants({
  ghost: {
    selectors: {
      "&:hover:not(:disabled)": {
        background: themeVars.color.background.panel,
        color: themeVars.color.text.primary,
      },
    },
  },
  icon: {
    borderColor: themeVars.color.border.standard,
    background: themeVars.color.surface.interactive,
    fontFamily: themeVars.font.family.mono,
    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: themeVars.color.border.strong,
        background: themeVars.color.surface.interactiveHover,
        color: themeVars.color.text.primary,
      },
    },
  },
  outline: {
    borderColor: themeVars.color.border.standard,
    background: themeVars.color.surface.interactive,
    selectors: {
      "&:hover:not(:disabled)": {
        borderColor: themeVars.color.border.strong,
        background: themeVars.color.surface.interactiveHover,
        color: themeVars.color.text.primary,
      },
    },
  },
  tab: {
    borderRadius: 0,
    selectors: {
      "&:hover:not(:disabled)": {
        background: themeVars.color.background.panel,
        color: themeVars.color.text.primary,
      },
    },
  },
});

export const buttonActive = style({
  borderColor: themeVars.color.border.accent,
  background: themeVars.color.surface.accentMuted,
  color: themeVars.color.text.primary,
  selectors: {
    [`&${buttonVariant.tab}`]: {
      background: themeVars.color.background.panel,
      boxShadow: `inset 0 1px 0 ${themeVars.color.border.accent}`,
    },
  },
});

export const buttonSquare = styleVariants({
  md: {
    padding: 0,
    width: themeVars.size.controlMd,
  },
  sm: {
    padding: 0,
    width: themeVars.size.controlSm,
  },
});
