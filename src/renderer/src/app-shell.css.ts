import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "./theme";

export const appShell = style({
  display: "grid",
  gridTemplateRows: `minmax(0, 1fr) ${themeVars.size.footerBarHeight}`,
  minHeight: "100vh",
});

export const footerBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `0 ${themeVars.space[5]}`,
  borderTop: `1px solid ${themeVars.color.border.standard}`,
  background: themeVars.color.background.panelMuted,
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
  background: themeVars.color.preview.background,
  position: "relative",
});

export const footerStatusButton = style({
  display: "inline-flex",
  alignItems: "center",
  gap: themeVars.space[2],
  minHeight: "20px",
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  border: `1px solid transparent`,
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
  borderRadius: themeVars.radius.pill,
  background: themeVars.color.surface.success,
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
  border: `1px solid ${themeVars.color.border.strong}`,
  background: "rgba(20, 27, 38, 0.97)",
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
