import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const selectBase = style({
  minWidth: "4.75rem",
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.surface.interactive,
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  selectors: {
    "&:focus-visible": {
      boxShadow: themeVars.shadow.focus,
      outline: "none",
    },
  },
});

export const selectSize = styleVariants({
  md: {
    height: themeVars.size.controlMd,
    padding: `0 ${themeVars.space[4]}`,
  },
  sm: {
    height: themeVars.size.controlSm,
    padding: `0 ${themeVars.space[3]}`,
  },
});
