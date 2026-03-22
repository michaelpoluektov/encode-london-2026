import { style } from "@vanilla-extract/css";
import { themeVars } from "../../../../theme";

export const graphNodeRoot = style({
  display: "grid",
  gap: themeVars.space[3],
  width: "100%",
  overflow: "visible",
});

export const graphNodeCard = style({
  position: "relative",
  display: "grid",
  gap: themeVars.space[3],
  minWidth: 0,
  padding: themeVars.space[4],
  background: "#262626",
  boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.2)",
  cursor: "default",
  transition: [
    `border-color ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
    `box-shadow ${themeVars.motion.duration.fast} ${themeVars.motion.easing.standard}`,
  ].join(", "),
  selectors: {
    "&:hover": {
      boxShadow: [
        themeVars.shadow.panel,
        "inset 0 0 0 1px rgba(72, 72, 72, 0.2)",
      ].join(", "),
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

export const graphNodeCheckboxRow = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeCheckbox = style({
  width: 16,
  height: 16,
  margin: 0,
  accentColor: themeVars.color.text.accent,
  cursor: "pointer",
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
  background: themeVars.color.background.panelInset,
  boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.18)",
});

export const graphNodeInputHandle = style({
  position: "absolute",
  top: "50%",
  left: 0,
  transform: "translate(-50%, -50%)",
  width: 12,
  height: 12,
  border: `2px solid #262626`,
  background: themeVars.color.surface.success,
});

export const graphNodeOutputHandle = style({
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translate(50%, -50%)",
  width: 12,
  height: 12,
  border: `2px solid #262626`,
  background: themeVars.color.surface.accent,
});

export const graphNodePreviewSlot = style({
  display: "grid",
  minWidth: 0,
});

const graphNodeControlBase = style({
  width: "100%",
  minWidth: 0,
  minHeight: themeVars.size.controlSm,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  border: "none",
  borderBottom: `1px solid rgba(72, 72, 72, 0.48)`,
  background: themeVars.color.background.panel,
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
      borderBottomColor: themeVars.color.surface.accent,
      boxShadow: `inset 0 -1px 0 ${themeVars.color.surface.accent}`,
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

export const graphNodeVectorControls = style({
  display: "grid",
  gap: themeVars.space[2],
  minWidth: 0,
});

export const graphNodeVectorRow = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: themeVars.space[2],
  alignItems: "center",
  minWidth: 0,
});

export const graphNodeVectorLabel = style({
  minWidth: themeVars.space[5],
  textTransform: "uppercase",
});

export const graphNodeColorInput = style([
  graphNodeControlBase,
  {
    padding: themeVars.space[1],
    cursor: "pointer",
  },
]);
