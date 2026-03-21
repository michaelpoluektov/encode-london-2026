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
  gap: themeVars.space[0],
  padding: themeVars.space[2],
});

export const treeShell = style({
  flex: 1,
  height: "100%",
  minHeight: 0,
  background: `linear-gradient(180deg, ${themeVars.color.background.panel} 0%, ${themeVars.color.background.panelInset} 100%)`,
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
      background: themeVars.color.surface.interactive,
      color: themeVars.color.text.primary,
    },
  },
});

export const treeRowSelected = style({
  background: themeVars.color.surface.accentMuted,
  color: themeVars.color.text.heading,
});

export const treeCaret = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  color: themeVars.color.text.muted,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  flexShrink: 0,
  transform: "translateY(-1px)",
});

export const treeCaretHidden = style({
  opacity: 0,
});

export const treeGlyph = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "8px",
  height: "8px",
  marginRight: "6px",
  borderRadius: themeVars.radius.pill,
});

export const folderGlyph = style({
  background: themeVars.color.surface.warning,
});

export const editableGlyph = style({
  background: themeVars.color.surface.accent,
});

export const readOnlyGlyph = style({
  background: themeVars.color.text.muted,
});

export const imageGlyph = style({
  background: themeVars.color.surface.success,
});

export const binaryGlyph = style({
  background: themeVars.color.surface.danger,
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
