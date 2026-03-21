import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const paneRestoreControl = style({
  position: "absolute",
  zIndex: 1,
});

export const paneRestorePlacement = styleVariants({
  bottomRight: {
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftCenter: {
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
  },
  topRight: {
    left: 0,
    right: 0,
    top: 0,
  },
});

export const paneRestoreButton = style({
  display: "flex",
  alignItems: "center",
  color: themeVars.color.text.muted,
  selectors: {
    "&:hover:not(:disabled)": {
      color: themeVars.color.text.primary,
    },
  },
});

export const paneRestorePlacementButton = styleVariants({
  bottomRight: {
    width: "100%",
    height: themeVars.size.panelHeaderHeight,
    justifyContent: "space-between",
    padding: `0 ${themeVars.space[3]}`,
    background: themeVars.color.background.panelMuted,
  },
  leftCenter: {
    width: themeVars.size.controlXs,
    height: `calc(${themeVars.size.controlXs} * 2)`,
    padding: 0,
    border: "none",
    background: themeVars.color.background.panelMuted,
  },
  topRight: {
    width: "100%",
    height: themeVars.size.panelHeaderHeight,
    justifyContent: "space-between",
    padding: `0 ${themeVars.space[3]}`,
    background: themeVars.color.background.panelMuted,
  },
});

export const paneRestoreLabel = style({
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: 1,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});
