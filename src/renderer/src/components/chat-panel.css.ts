import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const chatPanel = style({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100%",
  minHeight: 0,
});

export const chatPanelIntro = style({
  margin: 0,
  padding: `${themeVars.space[4]} ${themeVars.space[4]} 0`,
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

export const chatPanelEmptyState = style({
  display: "grid",
  alignItems: "center",
  minHeight: 0,
  padding: themeVars.space[4],
});

export const chatPanelWell = style({
  display: "grid",
  alignContent: "start",
  gap: themeVars.space[3],
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[4],
  border: `1px dashed ${themeVars.color.border.standard}`,
  background: themeVars.color.background.overlay,
});

export const chatPanelLabel = style({
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  letterSpacing: themeVars.font.tracking.eyebrow,
  textTransform: "uppercase",
});

export const chatPanelCopy = style({
  margin: 0,
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

export const chatPanelInputStub = style({
  padding: `${themeVars.space[3]} ${themeVars.space[4]}`,
  borderTop: `1px solid ${themeVars.color.border.subtle}`,
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});
