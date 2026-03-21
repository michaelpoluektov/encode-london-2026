import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const panel = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  height: "100%",
  minHeight: 0,
  background: `linear-gradient(180deg, ${themeVars.color.background.panelRaised} 0%, ${themeVars.color.background.panel} 100%)`,
  boxShadow: themeVars.shadow.panel,
  overflow: "hidden",
});

export const panelHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: themeVars.size.panelHeaderHeight,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: "rgba(255, 255, 255, 0.01)",
  backdropFilter: "blur(10px)",
});

export const panelHeaderControls = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[1],
});

export const panelHeaderLabel = style({
  marginRight: themeVars.space[3],
  color: themeVars.color.text.heading,
  fontFamily: '"Space Grotesk", "Inter", sans-serif',
  fontSize: themeVars.font.size.sm,
  fontWeight: themeVars.font.weight.medium,
  letterSpacing: themeVars.font.tracking.eyebrow,
  lineHeight: themeVars.font.lineHeight.normal,
  textTransform: "uppercase",
});

export const panelBody = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});
