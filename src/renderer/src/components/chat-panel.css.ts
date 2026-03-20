import { style } from "@vanilla-extract/css";
import { themeVars } from "../theme";

export const chatPanel = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
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
  whiteSpace: "pre-wrap",
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.relaxed,
});

export const chatMessageBubbleUser = style([
  chatMessageBubble,
  {
    alignSelf: "flex-end",
    background: themeVars.color.surface.accentMuted,
    color: themeVars.color.text.primary,
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

export const chatFileChange = style({
  alignSelf: "flex-start",
  padding: `${themeVars.space[1]} ${themeVars.space[2]}`,
  borderRadius: themeVars.radius.sm,
  background: themeVars.color.surface.successMuted,
  color: themeVars.color.text.secondary,
  fontFamily: themeVars.font.family.mono,
  fontSize: themeVars.font.size.xs,
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

export const chatTextarea = style({
  flex: 1,
  resize: "none",
  background: themeVars.color.background.panelInset,
  border: `1px solid ${themeVars.color.border.subtle}`,
  borderRadius: themeVars.radius.md,
  color: themeVars.color.text.primary,
  fontFamily: themeVars.font.family.sans,
  fontSize: themeVars.font.size.sm,
  lineHeight: themeVars.font.lineHeight.normal,
  padding: `${themeVars.space[2]} ${themeVars.space[3]}`,
  outline: "none",
  minHeight: "2.5rem",
  maxHeight: "8rem",
  overflowY: "auto",
  selectors: {
    "&:focus": {
      borderColor: themeVars.color.border.accent,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
});
