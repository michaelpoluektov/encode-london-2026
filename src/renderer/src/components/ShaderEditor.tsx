import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { GLSL_LANGUAGE_ID, registerGlslLanguage } from "../monaco-glsl";
import { useAppStore } from "../store/app-store";
import {
  darkThemeValues,
  defineShadilyMonacoTheme,
  SHADILY_MONACO_THEME,
} from "../theme";

loader.config({ monaco });

export const ShaderEditor = (): JSX.Element => {
  const shaderSource = useAppStore((state) => state.shaderSource);
  const setShaderSource = useAppStore((state) => state.setShaderSource);

  return (
    <div className={editorFrame}>
      <Editor
        beforeMount={(instance) => {
          registerGlslLanguage(instance);
          defineShadilyMonacoTheme(instance);
        }}
        height="100%"
        language={GLSL_LANGUAGE_ID}
        path="file:///project/material.frag"
        theme={SHADILY_MONACO_THEME}
        value={shaderSource}
        onChange={(value) => {
          if (value !== undefined) {
            setShaderSource(value);
          }
        }}
        options={{
          fontFamily: darkThemeValues.font.family.mono,
          fontSize: Number.parseInt(darkThemeValues.font.size.sm, 10),
          minimap: { enabled: false },
          padding: {
            top: Number.parseInt(darkThemeValues.size.editorPaddingTop, 10),
          },
          roundedSelection: false,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};
