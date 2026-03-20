import { style } from "@vanilla-extract/css";
import { themeVars } from "../../theme";

export const navItem = style({
  display: "grid",
  gap: themeVars.space[1],
  minWidth: 0,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderLeft: `1px solid ${themeVars.color.border.standard}`,
  color: themeVars.color.text.secondary,
  selectors: {
    "&:hover": {
      background: themeVars.color.background.panelInset,
    },
  },
});

export const navItemActive = style({
  borderLeftColor: themeVars.color.border.accent,
  background: themeVars.color.surface.accentMuted,
  color: themeVars.color.text.primary,
});
