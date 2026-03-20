import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { type JSX, useCallback, useRef } from "react";
import { editorFrame } from "../app-shell.css";
import { GLSL_LANGUAGE_ID, registerGlslLanguage } from "../monaco-glsl";
import {
  PREVIEW_VERTEX_SHADER,
  STARTER_FRAGMENT_SHADER,
} from "../shader-source";
import { useProjectStore } from "../store/project-store";
import {
  darkThemeValues,
  defineShadilyMonacoTheme,
  SHADILY_MONACO_THEME,
} from "../theme";

loader.config({ monaco });

export const ShaderEditor = (): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const activeFile = useProjectStore((s) => s.activeFile);
  const updateShader = useProjectStore((s) => s.updateShader);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shaderSource =
    project !== null
      ? project.shaders[activeFile]
      : activeFile === "fragment"
        ? STARTER_FRAGMENT_SHADER
        : PREVIEW_VERTEX_SHADER;

  const editorPath =
    project !== null
      ? `file://${project.folderPath}/${project.manifest.shaders[activeFile]}`
      : `file:///default/${activeFile === "fragment" ? "material.frag" : "material.vert"}`;

  const handleChange = useCallback(
    (value: string | undefined): void => {
      if (value === undefined || project === null) return;

      updateShader(activeFile, value);

      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const currentProject = useProjectStore.getState().project;
        if (currentProject === null) return;
        void window.shadily.project.save({
          folderPath: currentProject.folderPath,
          manifest: currentProject.manifest,
          shaders: currentProject.shaders,
        });
      }, 1000);
    },
    [project, activeFile, updateShader],
  );

  return (
    <div className={editorFrame}>
      <Editor
        beforeMount={(instance) => {
          registerGlslLanguage(instance);
          defineShadilyMonacoTheme(instance);
        }}
        height="100%"
        key={editorPath}
        language={GLSL_LANGUAGE_ID}
        path={editorPath}
        theme={SHADILY_MONACO_THEME}
        value={shaderSource}
        onChange={handleChange}
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
