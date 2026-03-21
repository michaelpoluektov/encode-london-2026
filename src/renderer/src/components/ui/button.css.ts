import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const buttonBase = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: themeVars.space[2],
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.sm,
  fontWeight: themeVars.font.weight.medium,
  lineHeight: "1",
  cursor: "pointer",
  transition: [
    `background ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `transform ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:focus-visible": {
      boxShadow: themeVars.shadow.focus,
      outline: "none",
    },
    "&:hover:not(:disabled)": {
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      cursor: "default",
      opacity: 0.5,
    },
  },
});

export const buttonSize = styleVariants({
  sm: {
    height: themeVars.size.controlSm,
    padding: `0 ${themeVars.space[3]}`,
    fontSize: themeVars.font.size.sm,
  },
  xs: {
    height: themeVars.size.controlXs,
    padding: 0,
    fontSize: themeVars.font.size.sm,
  },
});

export const buttonVariant = styleVariants({
  plain: {
    color: themeVars.color.surface.accent,
    selectors: {
      "&:hover:not(:disabled)": {
        background: "rgba(44, 44, 44, 0.24)",
        color: themeVars.color.text.primary,
      },
    },
  },
  outline: {
    background:
      "linear-gradient(135deg, rgba(199, 153, 255, 1) 0%, rgba(188, 135, 254, 1) 100%)",
    color: themeVars.color.text.inverse,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14)",
    selectors: {
      "&:hover:not(:disabled)": {
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 0 18px rgba(199, 153, 255, 0.2)",
      },
    },
  },
});

export const buttonSquare = styleVariants({
  sm: {
    padding: 0,
    width: themeVars.size.controlSm,
  },
  xs: {
    padding: 0,
    width: themeVars.size.controlXs,
  },
});
