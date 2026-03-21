import { globalStyle, style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const projectSidebar = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
});

export const projectSection = style({
  display: "grid",
  gap: themeVars.space[3],
  padding: themeVars.space[4],
});

export const projectActions = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
});

export const projectActionsPrimary = style({
  display: "flex",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const projectActionsToggle = style({
  marginLeft: "auto",
  color: themeVars.color.text.muted,
  fontSize: themeVars.font.size.sm,
});

export const treeShell = style({
  flex: 1,
  height: "100%",
  minHeight: 0,
  background: themeVars.color.background.panel,
  overflow: "hidden",
});

export const treeViewport = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});

export const treeClassName = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
});

globalStyle(`${treeClassName} [role="tree"]`, {
  width: "100% !important",
  minWidth: "100% !important",
});

globalStyle(`${treeClassName} [role="treeitem"]`, {
  outline: "none",
});

export const treeRow = style({
  appearance: "none",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: "0",
  width: "100%",
  height: "100%",
  background: "transparent",
  padding: "0",
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
  transition: `background ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}, color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  border: "0",
  outline: "none",
  margin: "0",
  selectors: {
    "&:hover": {
      background: "rgba(255, 255, 255, 0.03)",
      color: themeVars.color.text.primary,
    },
  },
});

export const treeRowSelected = style({
  background: themeVars.color.surface.accentMuted,
  color: themeVars.color.text.heading,
  boxShadow: "inset 2px 0 0 #c799ff",
});

export const treeCaret = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  height: "16px",
  fontSize: themeVars.font.size.xs,
  color: themeVars.color.text.muted,
  flexShrink: 0,
});

export const treeCaretHidden = style({
  visibility: "hidden",
});

export const treeGlyph = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "16px",
  height: "16px",
  fontSize: themeVars.font.size.sm,
  marginRight: "6px",
  color: themeVars.color.text.muted,
});

export const folderGlyph = style({
  color: themeVars.color.surface.warning,
});

export const editableGlyph = style({
  color: themeVars.color.surface.accent,
});

export const readOnlyGlyph = style({
  color: themeVars.color.text.muted,
});

export const imageGlyph = style({
  color: themeVars.color.surface.success,
});

export const binaryGlyph = style({
  color: themeVars.color.surface.danger,
});

export const treeLabelGroup = style({
  display: "grid",
  minWidth: 0,
  flex: 1,
});

export const treeLabel = style({
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const emptyState = style({
  display: "grid",
  placeItems: "center",
  minHeight: 0,
  padding: themeVars.space[7],
  textAlign: "center",
});
