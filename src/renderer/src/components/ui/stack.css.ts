import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const stackBase = style({
  display: "flex",
  minWidth: 0,
});

export const stackDirection = styleVariants({
  column: {
    flexDirection: "column",
  },
  row: {
    flexDirection: "row",
  },
});

export const stackGap = styleVariants({
  1: {
    gap: themeVars.space[1],
  },
  2: {
    gap: themeVars.space[2],
  },
  3: {
    gap: themeVars.space[3],
  },
  4: {
    gap: themeVars.space[4],
  },
  5: {
    gap: themeVars.space[5],
  },
  6: {
    gap: themeVars.space[6],
  },
  7: {
    gap: themeVars.space[7],
  },
  8: {
    gap: themeVars.space[8],
  },
  9: {
    gap: themeVars.space[9],
  },
});
