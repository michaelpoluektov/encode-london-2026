import { createVar, globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

const focusBorderVar = createVar();
const separatorBorderVar = createVar();
const sashHoverSizeVar = createVar();

export const splitLayout = style({
  height: "100%",
  minHeight: themeVars.size.panelMinHeight,
  vars: {
    [focusBorderVar]: themeVars.color.border.accent,
    [separatorBorderVar]: themeVars.color.border.subtle,
    [sashHoverSizeVar]: "6px",
  },
});

globalStyle(`${splitLayout}`, {
  vars: {
    "--focus-border": focusBorderVar,
    "--separator-border": separatorBorderVar,
    "--sash-hover-size": sashHoverSizeVar,
  },
});
