import { globalStyle, keyframes, style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

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
  borderBottom: `1px solid ${themeVars.color.border.subtle}`,
  background: themeVars.color.background.panelMuted,
});

export const chatThreadHeader = style({
  display: "flex",
  alignItems: "center",
  flex: 1,
  gap: themeVars.space[2],
  minWidth: 0,
  padding: `0 ${themeVars.space[4]} 0 0`,
});

export const chatThreadList = style({
  display: "flex",
  flex: 1,
  gap: 0,
  overflowX: "auto",
  minWidth: 0,
});

export const chatThreadTab = style({
  flex: "0 0 auto",
  borderRight: `1px solid ${themeVars.color.border.subtle}`,
});

export const chatThreadButton = style({
  minWidth: 0,
  maxWidth: "14rem",
  display: "flex",
  alignItems: "center",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[2]} ${themeVars.space[2]} ${themeVars.space[3]}`,
  border: "none",
  borderBottom: `2px solid transparent`,
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
  borderBottomColor: themeVars.color.border.accent,
  background: themeVars.color.background.panelRaised,
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
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
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
  flex: 1,
  overflowY: "auto",
  padding: `${themeVars.space[3]} ${themeVars.space[4]}`,
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[3],
});

export const chatMessageRow = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[1],
});

export const chatMessageBubble = style({
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.md,
  maxWidth: "85%",
  wordBreak: "break-word",
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
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
    background: themeVars.color.background.panelRaised,
    color: themeVars.color.text.body,
    border: `1px solid ${themeVars.color.border.subtle}`,
  },
]);

export const chatStreamingBubble = style([
  chatMessageBubble,
  {
    alignSelf: "flex-start",
    background: themeVars.color.background.panelRaised,
    color: themeVars.color.text.body,
    border: `1px solid ${themeVars.color.border.subtle}`,
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
  borderRadius: themeVars.radius.sm,
});

export const chatPartImage = style({
  display: "flex",
  flexDirection: "column",
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: themeVars.color.background.panelInset,
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.sm,
});

export const chatPartLabel = style({
  marginTop: themeVars.space[1],
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
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.sm,
  overflowX: "auto",
});
globalStyle(`${chatMarkdown} pre code`, {
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.relaxed,
  background: "none",
  padding: 0,
  borderRadius: 0,
  color: themeVars.color.text.code,
});
globalStyle(`${chatMarkdown} code`, {
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  background: themeVars.color.background.panelInset,
  padding: `1px ${themeVars.space[1]}`,
  borderRadius: themeVars.radius.sm,
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

export const chatFileChange = style({
  alignSelf: "flex-start",
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.surface.successMuted,
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
});

export const chatWarning = style({
  alignSelf: "stretch",
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.surface.warningMuted,
  color: themeVars.color.text.body,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.xs,
});

export const chatError = style({
  alignSelf: "stretch",
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.sm,
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
  minHeight: 20,
  padding: `${themeVars.space[2]} 0`,
});

export const chatLoadingDot = style({
  display: "inline-block",
  width: 4,
  height: 4,
  borderRadius: themeVars.radius.pill,
  background: themeVars.color.text.muted,
  animation: `${dotBounce} 900ms ease-in-out infinite`,
});

export const chatSystemMessage = style({
  alignSelf: "center",
  maxWidth: "100%",
  padding: `${themeVars.space[1]} ${themeVars.space[3]}`,
  borderRadius: themeVars.radius.pill,
  background: themeVars.color.background.panelMuted,
  border: `1px dashed ${themeVars.color.border.standard}`,
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
  padding: `${themeVars.space[3]} ${themeVars.space[4]}`,
  borderTop: `1px solid ${themeVars.color.border.subtle}`,
  display: "flex",
  gap: themeVars.space[2],
  alignItems: "flex-end",
});

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
  borderRadius: themeVars.radius.pill,
  background: themeVars.color.surface.successMuted,
  color: themeVars.color.text.secondary,
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
  gap: themeVars.space[1],
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  background: themeVars.color.background.panelInset,
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.sm,
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
});

export const chatToolCallSectionLabel = style({
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.sans,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: "0.6rem",
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
  padding: `2px ${themeVars.space[1]}`,
  background: "transparent",
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.sm,
  color: themeVars.color.text.secondary,
  cursor: "pointer",
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
  lineHeight: themeVars.font.lineHeight.normal,
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
  borderRadius: themeVars.radius.md,
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
});

// Inline image in tool call result
export const chatToolCallImage = style({
  maxWidth: "100%",
  maxHeight: "200px",
  borderRadius: themeVars.radius.sm,
  display: "block",
  marginTop: themeVars.space[1],
});
