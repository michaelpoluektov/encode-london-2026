import type * as Monaco from "monaco-editor";
import { darkThemeValues } from "./dark-theme.css";

export const SHADILY_MONACO_THEME = "shadily-dark";

export const defineShadilyMonacoTheme = (monaco: typeof Monaco): void => {
  monaco.editor.defineTheme(SHADILY_MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7d7983" },
      { token: "keyword", foreground: "c799ff" },
      { token: "number", foreground: "ff8ba0" },
      { token: "type", foreground: "69c8eb" },
    ],
    colors: {
      "editor.background": darkThemeValues.color.editor.background,
      "editor.foreground": darkThemeValues.color.text.primary,
      "editorGutter.background": darkThemeValues.color.editor.background,
      "editor.lineHighlightBackground":
        darkThemeValues.color.editor.lineHighlight,
      "editor.selectionBackground": darkThemeValues.color.editor.selection,
      "editorCursor.foreground": darkThemeValues.color.editor.cursor,
      "editorLineNumber.foreground": darkThemeValues.color.editor.gutter,
      "editorLineNumber.activeForeground": darkThemeValues.color.surface.accent,
      "editorIndentGuide.background": darkThemeValues.color.editor.indentGuide,
      "editorIndentGuide.activeBackground":
        darkThemeValues.color.editor.activeIndentGuide,
      "editorWidget.background": darkThemeValues.color.background.panelRaised,
      "editorWidget.border": darkThemeValues.color.border.standard,
      "editorSuggestWidget.background":
        darkThemeValues.color.background.panelRaised,
      "editorSuggestWidget.border": darkThemeValues.color.border.standard,
      "editorSuggestWidget.selectedBackground":
        darkThemeValues.color.surface.interactiveHover,
      "editorHoverWidget.background":
        darkThemeValues.color.background.panelRaised,
      "editorHoverWidget.border": darkThemeValues.color.border.standard,
      "scrollbar.shadow": darkThemeValues.color.editor.background,
      "scrollbarSlider.background": "rgba(199, 153, 255, 0.18)",
      "scrollbarSlider.hoverBackground": "rgba(199, 153, 255, 0.28)",
      "scrollbarSlider.activeBackground": "rgba(199, 153, 255, 0.36)",
      "minimapSlider.background": "rgba(199, 153, 255, 0.18)",
      "minimapSlider.hoverBackground": "rgba(199, 153, 255, 0.28)",
      "minimapSlider.activeBackground": "rgba(199, 153, 255, 0.36)",
      "dropdown.background": darkThemeValues.color.background.panelRaised,
      "dropdown.border": darkThemeValues.color.border.standard,
      "minimap.background": darkThemeValues.color.editor.background,
      "editorOverviewRuler.border": "transparent",
      "editorOverviewRuler.errorForeground": "rgba(199, 153, 255, 0.8)",
      "editorOverviewRuler.warningForeground": "rgba(199, 153, 255, 0.5)",
      "editorOverviewRuler.infoForeground": "rgba(199, 153, 255, 0.4)",
      "editorOverviewRuler.addedForeground": "rgba(105, 200, 235, 0.5)",
      "editorOverviewRuler.modifiedForeground": "rgba(199, 153, 255, 0.5)",
      "editorOverviewRuler.deletedForeground": "rgba(199, 153, 255, 0.5)",
      "editorOverviewRuler.findMatchForeground": "rgba(199, 153, 255, 0.5)",
      "editorOverviewRuler.selectionHighlightForeground": "rgba(199, 153, 255, 0.3)",
    },
  });
};
