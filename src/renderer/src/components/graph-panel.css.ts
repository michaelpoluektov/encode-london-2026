import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const graphPanel = style({
  display: "grid",
  placeItems: "center",
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[5],
  overflow: "hidden",
});

export const graphContainer = style({
  position: "relative",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
});

export const graphCollapseAction = style({
  position: "absolute",
  top: themeVars.space[3],
  right: themeVars.space[3],
  zIndex: 12,
});

export const graphPlaceholder = style({
  fontFamily: themeVars.font.family.mono,
  letterSpacing: "0.08em",
});
