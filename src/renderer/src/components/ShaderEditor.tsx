import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { JSX } from "react";
import { useAppStore } from "../store/app-store";

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
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Shader Source</p>
          <h2>Fragment shader</h2>
        </div>
      </div>
      <div className="editor-frame">
        <Editor
          defaultLanguage="cpp"
          defaultValue={starterShader}
          language="cpp"
          theme="vs-dark"
          value={shaderSource}
          onChange={(value) => setShaderSource(value ?? starterShader)}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            roundedSelection: false,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </section>
  );
};
