import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const graphPanel = style({
  display: "grid",
  gap: themeVars.space[4],
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[4],
  alignContent: "start",
  overflowY: "auto",
});

export const graphSection = style({
  display: "grid",
  gap: themeVars.space[2],
});

export const graphSectionTitle = style({
  letterSpacing: "0.04em",
  textTransform: "uppercase",
});

export const graphFeatureList = style({
  display: "grid",
  gap: themeVars.space[2],
  margin: 0,
  paddingLeft: themeVars.space[4],
  color: themeVars.color.text.body,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

export const graphBadgeRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: themeVars.space[2],
});

export const graphBadge = style({
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  borderRadius: themeVars.radius.pill,
  border: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelRaised,
});
