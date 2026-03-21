import { style } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const fieldChrome = style({
  minWidth: 0,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: 0,
  background: themeVars.color.background.panelInset,
  color: themeVars.color.text.primary,
  outline: "none",
  transition: [
    `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `background ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:focus, &:focus-visible, &[data-focused]": {
      borderColor: themeVars.color.border.accent,
      boxShadow: themeVars.shadow.focus,
    },
    "&:disabled, &[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const textInputField = style([
  fieldChrome,
  {
    width: "100%",
    height: themeVars.size.controlMd,
    padding: `0 ${themeVars.space[3]}`,
    fontFamily: themeVars.font.family.sans,
    fontSize: themeVars.font.size.sm,
    lineHeight: themeVars.font.lineHeight.normal,
  },
]);

export const textareaField = style([
  fieldChrome,
  {
    width: "100%",
    padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
    fontFamily: themeVars.font.family.sans,
    fontSize: themeVars.font.size.sm,
    lineHeight: themeVars.font.lineHeight.normal,
    resize: "none",
    minHeight: "2.5rem",
    maxHeight: "8rem",
    overflowY: "auto",
  },
]);
