import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const paneRestoreControl = style({
  position: "absolute",
  zIndex: 1,
  pointerEvents: "none",
});

export const paneRestorePlacement = styleVariants({
  bottomRight: {
    right: themeVars.space[2],
    bottom: themeVars.space[1],
  },
  leftCenter: {
    left: themeVars.space[2],
    top: "50%",
    transform: "translateY(-50%)",
  },
  topRight: {
    right: themeVars.space[2],
    top: themeVars.space[1],
  },
});

export const paneRestoreButton = style({
  pointerEvents: "auto",
});
