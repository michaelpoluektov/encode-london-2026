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
  flex: 1,
});

export const layoutViewport = style({
  minHeight: 0,
  padding: 0,
});

export const workspaceShell = style({
  height: "100%",
  minHeight: 0,
});

export const workspaceGrid = style({
  height: "100%",
  minHeight: 0,
});

export const workspaceColumn = style({
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

export const editorEmptyState = style({
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: themeVars.space[3],
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  padding: themeVars.space[8],
  textAlign: "center",
  background: `linear-gradient(180deg, ${themeVars.color.background.panel} 0%, ${themeVars.color.background.panelInset} 100%)`,
});

export const editorImageFrame = style({
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: themeVars.space[4],
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  padding: themeVars.space[7],
  background: `linear-gradient(180deg, ${themeVars.color.background.panel} 0%, ${themeVars.color.background.panelInset} 100%)`,
});

export const editorImagePreview = style({
  display: "block",
  maxWidth: "100%",
  maxHeight: "100%",
  minWidth: 0,
  minHeight: 0,
  objectFit: "contain",
  borderRadius: themeVars.radius.lg,
  boxShadow: themeVars.shadow.panel,
});

export const previewFrame = style({
  display: "grid",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  padding: 0,
});

export const viewportHost = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  background: themeVars.color.preview.background,
  position: "relative",
});

globalStyle(`${viewportHost} canvas`, {
  display: "block",
  height: "100% !important",
  width: "100% !important",
});
