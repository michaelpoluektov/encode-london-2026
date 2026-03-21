import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./theme";

export const appShell = style({
  display: "grid",
  gridTemplateRows: `minmax(0, 1fr) ${themeVars.size.footerBarHeight}`,
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
});

export const footerBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `0 ${themeVars.space[5]}`,
  background: "rgba(255, 255, 255, 0.015)",
  backdropFilter: "blur(14px)",
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});

export const layoutViewport = style({
  minHeight: 0,
  padding: 0,
  position: "relative",
});

export const workspaceShell = style({
  height: "100%",
  minHeight: 0,
  position: "relative",
});

export const workspaceGrid = style({
  height: "100%",
  minHeight: 0,
});

export const workspaceColumn = style({
  height: "100%",
  minHeight: 0,
  position: "relative",
});

export const shellFrame = style({
  minWidth: 0,
  position: "relative",
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

export const footerStatusButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: themeVars.space[2],
  minHeight: "20px",
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  border: "none",
  background: "transparent",
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  selectors: {
    "&:hover:not(:disabled)": {
      color: themeVars.color.text.primary,
    },
    "&:focus-visible": {
      outline: "none",
      boxShadow: themeVars.shadow.focus,
    },
    "&:disabled": {
      cursor: "default",
      opacity: 0.72,
    },
  },
});

export const footerStatusButtonDirty = style({
  color: themeVars.color.surface.danger,
  textShadow: "0 0 12px rgba(222, 125, 125, 0.22)",
});

export const footerStatusDot = style({
  width: "8px",
  height: "8px",
  background: themeVars.color.surface.success,
  transform: "rotate(45deg)",
  boxShadow: "0 0 10px rgba(113, 199, 154, 0.28)",
});

export const footerStatusDotDirty = style({
  background: themeVars.color.surface.danger,
  boxShadow: "0 0 12px rgba(222, 125, 125, 0.42)",
});

export const footerDiagnosticPopover = style({
  position: "absolute",
  left: 0,
  bottom: `calc(100% + ${themeVars.space[3]})`,
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[2],
  width: "min(42rem, calc(100vw - 2rem))",
  padding: `${themeVars.space[3]} ${themeVars.space[4]}`,
  border: "none",
  background: "rgba(38, 38, 38, 0.7)",
  backdropFilter: "blur(20px)",
  boxShadow: themeVars.shadow.panel,
  zIndex: 2,
});

export const footerDiagnosticMeta = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[3],
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});

export const footerDiagnosticMessage = style({
  margin: 0,
  whiteSpace: "pre-wrap",
  color: themeVars.color.text.body,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

globalStyle(`${viewportHost} canvas`, {
  display: "block",
  height: "100% !important",
  width: "100% !important",
});
