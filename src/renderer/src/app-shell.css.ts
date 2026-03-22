import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./theme";

export const appShell = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
});

export const layoutViewport = style({
  flex: 1,
  height: "100%",
  minHeight: 0,
  padding: 0,
  position: "relative",
  boxSizing: "border-box",
});

export const layoutViewportProjectCollapsed = style({
  paddingLeft: themeVars.size.controlXs,
});

export const workspaceShell = style({
  height: "100%",
  minHeight: 0,
  position: "relative",
});

export const workspaceGrid = style({
  height: "100%",
  minHeight: 0,
  position: "relative",
  boxSizing: "border-box",
});

export const workspaceGridChatCollapsed = style({
  paddingRight: themeVars.size.controlXs,
});

export const workspaceColumn = style({
  height: "100%",
  minHeight: 0,
  position: "relative",
});

export const workspaceColumnWithTopRestore = style({
  boxSizing: "border-box",
  paddingTop: themeVars.size.panelHeaderHeight,
});

export const editorFrame = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});

export const editorContent = style({
  display: "grid",
  flex: "1 1 0",
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
  background: themeVars.color.background.panel,
});

export const editorImageFrame = style({
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: themeVars.space[4],
  flex: "1 1 0",
  minHeight: 0,
  minWidth: 0,
  padding: themeVars.space[7],
  background: themeVars.color.background.panel,
});

export const editorImageCaption = style({
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  textAlign: "center",
  marginTop: themeVars.space[3],
  lineHeight: themeVars.font.lineHeight.normal,
});

export const editorImagePreview = style({
  display: "block",
  maxWidth: "100%",
  maxHeight: "100%",
  minWidth: 0,
  minHeight: 0,
  objectFit: "contain",
  boxShadow: themeVars.shadow.panel,
});

export const previewFrame = style({
  display: "grid",
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  padding: 0,
  position: "relative",
});

export const previewFrameStale = style({
  selectors: {
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      boxShadow: [
        `inset 0 0 0 2px ${themeVars.color.surface.danger}`,
        "inset 0 0 0 4px rgba(222, 125, 125, 0.16)",
        "inset 0 0 24px rgba(222, 125, 125, 0.18)",
      ].join(", "),
      zIndex: 1,
    },
  },
});

export const viewportHost = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  background: "transparent",
  position: "relative",
});

globalStyle(`${viewportHost} canvas`, {
  display: "block",
  height: "100% !important",
  width: "100% !important",
});
