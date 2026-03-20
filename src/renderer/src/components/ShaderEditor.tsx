import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { JSX } from "react";
import { editorFrame } from "../app-shell.css";
import { useAppStore } from "../store/app-store";
import { defineShadilyMonacoTheme, SHADILY_MONACO_THEME } from "../theme";
import { Panel } from "./Panel";

loader.config({ monaco });

const starterShader = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

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
        beforeMount={(instance) => defineShadilyMonacoTheme(instance)}
        defaultLanguage="cpp"
        defaultValue={starterShader}
        language="cpp"
        theme={SHADILY_MONACO_THEME}
        value={shaderSource}
        onChange={(value) => setShaderSource(value ?? starterShader)}
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
