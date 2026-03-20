import { style } from "@vanilla-extract/css";
import { themeVars } from "./theme";

export const appShell = style({
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: themeVars.space[6],
  minHeight: "100vh",
  padding: themeVars.space[6],
  "@media": {
    "(width <= 960px)": {
      padding: themeVars.space[4],
    },
  },
});

export const heroPanelBody = style({
  display: "grid",
  gap: themeVars.space[6],
  padding: `0 ${themeVars.space[5]} ${themeVars.space[5]}`,
});

export const heroPanelHeading = style({
  display: "grid",
  gap: themeVars.space[3],
});

export const heroTitle = style({
  margin: 0,
  fontSize: themeVars.font.size.hero,
  lineHeight: themeVars.font.lineHeight.tight,
  letterSpacing: "-0.04em",
});

export const heroCopy = style({
  maxWidth: "62ch",
  margin: 0,
  color: themeVars.color.text.secondary,
  fontSize: themeVars.font.size.lg,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

export const badgeRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: themeVars.space[3],
});

export const workspaceSection = style({
  minHeight: 0,
});

export const splitPanelBody = style({
  height: "calc(100vh - 312px)",
  minHeight: themeVars.size.panelMinHeight,
  "@media": {
    "(width <= 960px)": {
      height: "60vh",
    },
  },
});

export const editorFrame = style({
  height: "100%",
  minHeight: 0,
});

export const previewFrame = style({
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[4],
});

export const viewportHost = style({
  height: "100%",
  minHeight: 0,
  borderRadius: themeVars.radius.md,
  overflow: "hidden",
  background: themeVars.color.preview.background,
  border: `1px solid ${themeVars.color.border.subtle}`,
});
