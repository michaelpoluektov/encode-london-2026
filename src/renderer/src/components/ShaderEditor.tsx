import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { GLSL_LANGUAGE_ID, registerGlslLanguage } from "../monaco-glsl";
import { useAppStore } from "../store/app-store";
import { defineShadilyMonacoTheme, SHADILY_MONACO_THEME } from "../theme";
import { Panel } from "./Panel";

loader.config({ monaco });

export const ShaderEditor = (): JSX.Element => {
  const shaderSource = useAppStore((state) => state.shaderSource);
  const setShaderSource = useAppStore((state) => state.setShaderSource);

  return (
    <Panel
      eyebrow="Shader Source"
      title="Fragment shader"
      bodyClassName={editorFrame}
    >
      <Editor
        beforeMount={(instance) => {
          registerGlslLanguage(instance);
          defineShadilyMonacoTheme(instance);
        }}
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
          minimap: { enabled: false },
          fontSize: 14,
          padding: {
            top: 20,
          },
          roundedSelection: false,
          scrollBeyondLastLine: false,
        }}
      />
    </Panel>
  );
};
