import { style, styleVariants } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const well = style({
  display: "grid",
  alignContent: "start",
  gap: themeVars.space[3],
  minWidth: 0,
  padding: themeVars.space[4],
  borderRadius: themeVars.radius.lg,
});

export const wellTone = styleVariants({
  accent: {
    border: `1px solid ${themeVars.color.border.accent}`,
    background: themeVars.color.surface.accentMuted,
  },
  inset: {
    border: `1px dashed ${themeVars.color.border.standard}`,
    background: themeVars.color.background.panelInset,
  },
});

export const emptyState = style({
  display: "grid",
  alignItems: "center",
  justifyItems: "center",
  height: "100%",
  minHeight: 0,
  padding: themeVars.space[5],
});
