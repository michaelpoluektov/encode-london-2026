import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const workspaceRegionHeader = style({
  alignItems: "center",
  flexWrap: "nowrap",
});

export const workspaceRegionActions = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: themeVars.space[2],
  justifyContent: "flex-end",
  minWidth: 0,
  flexShrink: 0,
});

export const workspaceRegionTabs = style({
  display: "flex",
  alignItems: "stretch",
  gap: themeVars.space[2],
  padding: `${themeVars.space[2]} ${themeVars.space[5]}`,
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelMuted,
  overflowX: "auto",
});

export const workspaceRegionTab = style({
  whiteSpace: "nowrap",
});

export const workspaceRegionBody = styleVariants({
  single: {
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr)",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },
  tabbed: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  },
});

export const workspaceRegionEmpty = style({
  height: "100%",
  minHeight: 0,
});
