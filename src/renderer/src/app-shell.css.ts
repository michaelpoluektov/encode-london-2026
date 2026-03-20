import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./theme";

export const appShell = style({
  display: "grid",
  gridTemplateRows: `${themeVars.size.headerBarHeight} minmax(0, 1fr) ${themeVars.size.footerBarHeight}`,
  minHeight: "100vh",
});

export const headerBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: themeVars.space[4],
  minWidth: 0,
  padding: `0 ${themeVars.space[5]}`,
  borderBottom: `1px solid ${themeVars.color.border.standard}`,
  background: themeVars.color.background.panelMuted,
});

export const footerBar = style({
  display: "flex",
  alignItems: "center",
  padding: `0 ${themeVars.space[5]}`,
  borderTop: `1px solid ${themeVars.color.border.standard}`,
  background: themeVars.color.background.panelMuted,
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});

export const shellTitle = style({
  margin: 0,
  fontSize: themeVars.font.size.md,
  fontWeight: themeVars.font.weight.medium,
  lineHeight: themeVars.font.lineHeight.tight,
  letterSpacing: 0,
});

export const headerActions = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[3],
  minWidth: 0,
});

export const panelToggleGroup = style({
  display: "flex",
  flexWrap: "wrap",
  gap: themeVars.space[2],
});

export const panelToggle = style({
  padding: `${themeVars.space[1]} ${themeVars.space[4]}`,
  border: `1px solid ${themeVars.color.border.standard}`,
  borderRadius: themeVars.radius.sm,
  background: "transparent",
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.xs,
  fontWeight: themeVars.font.weight.regular,
  letterSpacing: 0,
  transition: `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}, color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}, background ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  selectors: {
    "&:hover": {
      borderColor: themeVars.color.border.strong,
      color: themeVars.color.text.primary,
    },
  },
});

export const panelToggleActive = style({
  background: themeVars.color.surface.accentMuted,
  borderColor: themeVars.color.border.accent,
  color: themeVars.color.text.primary,
});

export const layoutViewport = style({
  minHeight: 0,
  padding: 0,
});

export const workspaceShell = style({
  height: "100%",
  minHeight: 0,
});

export const shellFrame = style({
  minWidth: 0,
});

export const editorFrame = style({
  display: "grid",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});

export const previewFrame = style({
  display: "grid",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  padding: themeVars.space[4],
});

export const viewportHost = style({
  height: "100%",
  minHeight: "140px",
  minWidth: 0,
  overflow: "hidden",
  background: themeVars.color.preview.background,
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.md,
  position: "relative",
});

globalStyle(`${viewportHost} canvas`, {
  display: "block",
  height: "100% !important",
  width: "100% !important",
});
