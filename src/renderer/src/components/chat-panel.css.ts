import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const chatPanel = style({
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  height: "100%",
  minHeight: 0,
});

export const chatPanelIntro = style({
  padding: `${themeVars.space[4]} ${themeVars.space[4]} 0`,
});

export const chatPanelWell = style({
  width: "100%",
  maxWidth: "28rem",
});

export const chatPanelInputStub = style({
  padding: `${themeVars.space[3]} ${themeVars.space[4]}`,
  borderTop: `1px solid ${themeVars.color.border.subtle}`,
});
