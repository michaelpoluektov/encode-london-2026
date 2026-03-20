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

export const projectSectionLabel = style({
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  letterSpacing: themeVars.font.tracking.eyebrow,
  textTransform: "uppercase",
});

export const projectList = style({
  display: "grid",
  gap: themeVars.space[2],
});

export const projectItem = style({
  display: "grid",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderLeft: `1px solid ${themeVars.color.border.standard}`,
  color: themeVars.color.text.secondary,
});

export const projectItemActive = style({
  borderLeftColor: themeVars.color.border.accent,
  color: themeVars.color.text.primary,
});

export const projectItemName = style({
  fontSize: themeVars.font.size.sm,
});

export const projectItemPath = style({
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});
