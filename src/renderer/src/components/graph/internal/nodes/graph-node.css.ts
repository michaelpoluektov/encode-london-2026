import { style } from "@vanilla-extract/css";
import { themeVars } from "../../../../theme";

export const graphNodeRoot = style({
  position: "relative",
  width: "100%",
  overflow: "visible",
});

export const graphNodeCard = style({
  position: "relative",
  display: "grid",
  gap: themeVars.space[3],
  minWidth: 0,
  padding: themeVars.space[4],
  borderRadius: themeVars.radius.lg,
  border: `1px solid ${themeVars.color.border.standard}`,
  background: themeVars.color.background.panelRaised,
  boxShadow: themeVars.shadow.panel,
  cursor: "default",
  transition: [
    `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:hover": {
      borderColor: themeVars.color.border.accent,
      boxShadow: themeVars.shadow.focus,
    },
  },
});

export const graphNodeHeader = style({
  display: "grid",
  minWidth: 0,
});

export const graphNodeDetails = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeControls = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeDetailRow = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: themeVars.space[2],
  alignItems: "baseline",
  minWidth: 0,
});

export const graphNodeInputs = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeInputRow = style({
  position: "relative",
  minHeight: themeVars.size.controlSm,
  minWidth: 0,
  paddingLeft: themeVars.space[7],
  display: "flex",
  alignItems: "center",
  borderRadius: themeVars.radius.md,
  background: themeVars.color.background.panelInset,
  border: `1px solid ${themeVars.color.border.subtle}`,
});

export const graphNodeInputHandle = style({
  position: "absolute",
  top: "50%",
  left: 0,
  transform: "translate(-50%, -50%)",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: `2px solid ${themeVars.color.background.panelRaised}`,
  background: themeVars.color.border.accent,
});

export const graphNodeOutputHandle = style({
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translate(50%, -50%)",
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: `2px solid ${themeVars.color.background.panelRaised}`,
  background: themeVars.color.border.accent,
});

export const graphNodePreviewSlot = style({
  position: "absolute",
  top: `calc(100% + ${themeVars.space[3]})`,
  left: 0,
  right: 0,
  zIndex: 1,
});

const graphNodeControlBase = style({
  width: "100%",
  minWidth: 0,
  minHeight: themeVars.size.controlSm,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.md,
  border: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelInset,
  color: themeVars.color.text.body,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.sm,
  outline: "none",
  transition: [
    `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:focus": {
      borderColor: themeVars.color.border.accent,
      boxShadow: `0 0 0 3px ${themeVars.color.focus.ring}`,
    },
  },
});

export const graphNodeNumberInput = style([
  graphNodeControlBase,
  {
    appearance: "textfield",
  },
]);

export const graphNodeRangeRow = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: themeVars.space[3],
  alignItems: "center",
  minWidth: 0,
});

export const graphNodeRangeInput = style({
  width: "100%",
  minWidth: 0,
  accentColor: themeVars.color.text.accent,
  cursor: "pointer",
});

export const graphNodeRangeValue = style({
  width: "5ch",
  minWidth: "5ch",
  textAlign: "right",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
});

export const graphNodeColorInput = style([
  graphNodeControlBase,
  {
    padding: themeVars.space[1],
    cursor: "pointer",
  },
]);
