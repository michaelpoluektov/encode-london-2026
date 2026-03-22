import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { themeVars } from "../theme";
import { fieldChrome } from "./ui/field.css";

export const chatPanel = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
});

export const chatHeader = style({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: themeVars.space[2],
  background: "rgba(255, 255, 255, 0.015)",
  backdropFilter: "blur(12px)",
});

export const chatThreadHeader = style({
  display: "flex",
  alignItems: "center",
  flex: 1,
  gap: themeVars.space[2],
  minWidth: 0,
  padding: `0 ${themeVars.space[4]} 0 0`,
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const chatThreadList = style({
  display: "flex",
  flex: "0 0 auto",
  gap: 0,
  minWidth: 0,
});

export const chatThreadTab = style({
  flex: "0 0 auto",
});

export const chatThreadButton = style({
  minWidth: 0,
  maxWidth: "14rem",
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[2]} ${themeVars.space[2]} ${themeVars.space[3]}`,
  border: "none",
  background: "transparent",
  color: themeVars.color.text.secondary,
  textAlign: "left",
  selectors: {
    "&:hover": {
      background: themeVars.color.background.panelInset,
      color: themeVars.color.text.primary,
    },
  },
});

export const chatThreadButtonActive = style({
  boxShadow: "inset 0 2px 0 #c799ff",
  color: themeVars.color.text.primary,
});

export const chatThreadSelectButton = style({
  minWidth: 0,
  flex: 1,
  display: "flex",
  alignItems: "center",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  textAlign: "left",
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.6,
    },
  },
});

export const chatThreadTitle = style({
  display: "block",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
});

export const chatThreadDeleteButton = style({
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontFamily: themeVars.font.family.sans,
  lineHeight: themeVars.font.lineHeight.normal,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: themeVars.size.controlXs,
  minHeight: themeVars.size.controlXs,
  fontSize: themeVars.font.size.sm,
  selectors: {
    "&:hover:not(:disabled)": {
      color: themeVars.color.text.primary,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
  },
});

export const chatMessages = style({
  height: "100%",
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  padding: `${themeVars.space[4]} ${themeVars.space[5]}`,
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[3],
});

export const chatMessagesViewport = style({
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  position: "relative",
});

export const chatMessageRow = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[1],
});

export const chatMessageBubble = style({
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  maxWidth: "85%",
  wordBreak: "break-word",
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
  position: "relative",
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "18px",
      height: "18px",
      borderTop: `1px solid ${themeVars.color.border.accent}`,
      borderLeft: `1px solid ${themeVars.color.border.accent}`,
      opacity: 0.4,
      pointerEvents: "none",
    },
  },
});

export const chatMessageBody = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[2],
});

export const chatMessageBubbleUser = style([
  chatMessageBubble,
  {
    alignSelf: "flex-end",
    background: themeVars.color.surface.accentMuted,
    color: themeVars.color.text.primary,
    whiteSpace: "pre-wrap",
  },
]);

export const chatMessageBubbleAssistant = style([
  chatMessageBubble,
  {
    alignSelf: "flex-start",
    background: "rgba(38, 38, 38, 0.7)",
    color: themeVars.color.text.body,
    backdropFilter: "blur(20px)",
    boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.2)",
  },
]);

export const chatStreamingBubble = style([
  chatMessageBubble,
  {
    alignSelf: "flex-start",
    background: "rgba(38, 38, 38, 0.7)",
    color: themeVars.color.text.body,
    backdropFilter: "blur(20px)",
    boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.2)",
    opacity: 0.85,
  },
]);

export const chatPartBlock = style({
  whiteSpace: "pre-wrap",
});

export const chatPartReasoning = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: themeVars.color.background.panelInset,
  border: `1px dashed ${themeVars.color.border.standard}`,
});

export const chatPartPre = style({
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

// Markdown content inside assistant bubbles
export const chatMarkdown = style({
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
  color: "inherit",
});

globalStyle(`${chatMarkdown} p`, { margin: 0 });
globalStyle(`${chatMarkdown} p + p`, { marginTop: themeVars.space[2] });
globalStyle(`${chatMarkdown} pre`, {
  margin: `${themeVars.space[2]} 0 0`,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: themeVars.color.background.panelInset,
  boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.16)",
  overflowX: "auto",
});
globalStyle(`${chatMarkdown} pre code`, {
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
  background: "none",
  padding: 0,
  color: themeVars.color.text.code,
});
globalStyle(`${chatMarkdown} code`, {
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  background: themeVars.color.background.panelInset,
  padding: `1px ${themeVars.space[1]}`,
  color: themeVars.color.text.code,
});
globalStyle(`${chatMarkdown} ul, ${chatMarkdown} ol`, {
  margin: `${themeVars.space[1]} 0`,
  paddingLeft: themeVars.space[4],
});
globalStyle(`${chatMarkdown} li`, { margin: `${themeVars.space[1]} 0` });
globalStyle(`${chatMarkdown} strong`, {
  fontWeight: themeVars.font.weight.strong,
});

export const chatWarning = style({
  alignSelf: "stretch",
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: themeVars.color.surface.warningMuted,
  color: themeVars.color.text.body,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.xs,
});

export const chatError = style({
  alignSelf: "stretch",
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: "rgba(222, 125, 125, 0.12)",
  color: themeVars.color.surface.danger,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.xs,
});

const dotBounce = keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-4px)" },
});

export const chatLoadingSpinner = style({
  display: "flex",
  gap: themeVars.space[2],
  alignItems: "center",
  justifyContent: "center",
  minHeight: themeVars.size.controlSm,
  minWidth: themeVars.size.controlMd,
});

export const chatLoadingDot = style({
  display: "block",
  flexShrink: 0,
  width: 5,
  height: 5,
  borderRadius: "999px",
  background: themeVars.color.text.accent,
  boxShadow: "0 0 10px rgba(121, 190, 255, 0.2)",
  animation: `${dotBounce} 900ms ease-in-out infinite`,
});

export const chatLoadingMessage = style([
  chatStreamingBubble,
  {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    minWidth: themeVars.size.controlMd,
    opacity: 1,
  },
]);

export const chatSystemMessage = style({
  alignSelf: "center",
  maxWidth: "100%",
  padding: `${themeVars.space[1]} ${themeVars.space[3]}`,
  background: "rgba(44, 44, 44, 0.7)",
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.normal,
  textAlign: "center",
});

export const chatEmpty = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: themeVars.space[4],
});

export const chatInputArea = style({
  padding: `${themeVars.space[4]} ${themeVars.space[5]}`,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: themeVars.space[2],
  alignItems: "end",
  background: "rgba(255, 255, 255, 0.015)",
  backdropFilter: "blur(12px)",
});

export const chatInputFieldSlot = style({
  minWidth: 0,
  display: "flex",
  alignItems: "stretch",
});

export const chatInputLoadingField = style([
  fieldChrome,
  {
    width: "100%",
    minHeight: themeVars.size.controlSm,
    padding: `4px ${themeVars.space[3]}`,
    display: "flex",
    alignItems: "center",
    gap: themeVars.space[2],
    cursor: "progress",
  },
]);

// File change chips (live streaming events)
export const chatFileChangeRow = style({
  display: "flex",
  flexWrap: "wrap",
  gap: themeVars.space[1],
  alignSelf: "flex-start",
});

export const chatFileChip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: themeVars.space[1],
  padding: `2px ${themeVars.space[2]}`,
  background: "rgba(74, 248, 227, 0.12)",
  color: themeVars.color.text.code,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.normal,
  whiteSpace: "nowrap",
  maxWidth: "16rem",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const chatFileChipKind = style({
  flexShrink: 0,
  fontWeight: themeVars.font.weight.strong,
  opacity: 0.7,
});

// Tool call block
export const chatToolCallBlock = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  width: "100%",
  background: "rgba(38, 38, 38, 0.7)",
  boxShadow: "inset 0 0 0 1px rgba(72, 72, 72, 0.2)",
  backdropFilter: "blur(20px)",
  fontSize: themeVars.font.size.xs,
});

export const chatToolCallHeader = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
});

export const chatToolCallName = style({
  fontFamily: themeVars.font.family.mono,
  fontWeight: themeVars.font.weight.strong,
  color: themeVars.color.text.primary,
});

export const chatToolCallSection = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[1],
  width: "100%",
  alignItems: "center",
});

export const chatToolCallPre = style({
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
  color: themeVars.color.text.body,
});

export const chatToolCallError = style({
  color: themeVars.color.text.accent,
});

export const chatToolCallTable = style({
  borderCollapse: "collapse",
  display: "inline-table",
  background: "rgba(255, 255, 255, 0.04)",
});

export const chatToolCallTableRow = style({
  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  selectors: {
    "&:last-child": {
      borderBottom: "none",
    },
  },
});

export const chatToolCallTableHeader = style({
  fontFamily: themeVars.font.family.sans,
  color: themeVars.color.text.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: "0.6rem",
  padding: `${themeVars.space[1]} ${themeVars.space[4]} ${themeVars.space[1]} ${themeVars.space[2]}`,
  textAlign: "left",
  fontWeight: themeVars.font.weight.medium,
  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
});

export const chatToolCallTableKey = style({
  fontFamily: themeVars.font.family.mono,
  color: themeVars.color.text.secondary,
  padding: `${themeVars.space[1]} ${themeVars.space[4]} ${themeVars.space[1]} ${themeVars.space[2]}`,
  verticalAlign: "top",
  whiteSpace: "nowrap",
});

export const chatToolCallTableValue = style({
  fontFamily: themeVars.font.family.mono,
  color: themeVars.color.text.body,
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  wordBreak: "break-word",
  whiteSpace: "nowrap",
});

// Checkpoint divider
export const chatCheckpointDivider = style({
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[2],
  padding: `${themeVars.space[1]} 0`,
});

export const chatCheckpointLine = style({
  flex: 1,
  height: "1px",
  background: themeVars.color.border.subtle,
  opacity: 0.5,
});

export const chatCheckpointActions = style({
  display: "flex",
  gap: themeVars.space[1],
  flexShrink: 0,
});

export const chatCheckpointButton = style({
  minWidth: themeVars.size.controlSm,
  minHeight: themeVars.size.controlSm,
  padding: 0,
  background: "rgba(44, 44, 44, 0.28)",
  border: "none",
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  selectors: {
    "&:hover:not(:disabled)": {
      color: themeVars.color.text.primary,
      borderColor: themeVars.color.border.accent,
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
  },
});

export const chatCheckpointPreviewModal = style({
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.7)",
  cursor: "pointer",
});

export const chatCheckpointPreviewImage = style({
  maxWidth: "min(80vw, 600px)",
  maxHeight: "80vh",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
});

// Inline image in tool call result
export const chatToolCallImage = style({
  width: "auto",
  height: "auto",
  maxWidth: "100%",
  maxHeight: "200px",
  alignSelf: "center",
  objectFit: "contain",
  display: "block",
  background: "transparent",
});
