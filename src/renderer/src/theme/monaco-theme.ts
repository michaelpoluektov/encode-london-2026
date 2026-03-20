import type * as Monaco from "monaco-editor";
import { darkThemeValues } from "./dark-theme.css";

export const SHADILY_MONACO_THEME = "shadily-dark";

export const defineShadilyMonacoTheme = (monaco: typeof Monaco): void => {
  monaco.editor.defineTheme(SHADILY_MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7e96bf" },
      { token: "keyword", foreground: "f3c987" },
      { token: "number", foreground: "9dc2ff" },
      { token: "type", foreground: "84d2c7" },
    ],
    colors: {
      "editor.background": darkThemeValues.color.editor.background,
      "editor.foreground": darkThemeValues.color.text.primary,
      "editor.lineHighlightBackground":
        darkThemeValues.color.editor.lineHighlight,
      "editor.selectionBackground": darkThemeValues.color.editor.selection,
      "editorCursor.foreground": darkThemeValues.color.editor.cursor,
      "editorLineNumber.foreground": darkThemeValues.color.editor.gutter,
      "editorLineNumber.activeForeground": darkThemeValues.color.text.secondary,
      "editorIndentGuide.background": "#14223b",
      "editorIndentGuide.activeBackground": "#1e3458",
      "editorWidget.background": darkThemeValues.color.background.panel,
      "editorWidget.border": darkThemeValues.color.border.standard,
      "minimap.background": darkThemeValues.color.editor.background,
    },
  });
};
