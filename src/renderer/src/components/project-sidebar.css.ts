import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const projectSidebar = style({
  display: "grid",
  gap: themeVars.space[4],
  padding: themeVars.space[4],
  height: "100%",
  minHeight: 0,
  alignContent: "start",
});

export const projectSection = style({
  display: "grid",
  gap: themeVars.space[2],
});

export const projectList = style({
  display: "grid",
  gap: themeVars.space[2],
});
