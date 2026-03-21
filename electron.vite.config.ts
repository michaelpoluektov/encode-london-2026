import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import type { Plugin } from "vite";

const copyProjectTemplatePlugin = (): Plugin => {
  let outDir = "out/main";

  return {
    name: "copy-project-template",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const sourceDir = resolve("src/project-template");
      const targetDir = resolve(outDir, "../project-template");

      if (!existsSync(sourceDir)) {
        throw new Error(`Project template folder not found: ${sourceDir}`);
      }

      rmSync(targetDir, { recursive: true, force: true });
      cpSync(sourceDir, targetDir, { recursive: true });
    },
  };
};

export default defineConfig(() => {
  return {
    main: {
      plugins: [externalizeDepsPlugin(), copyProjectTemplatePlugin()],
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      root: "src/renderer",
      build: {
        rollupOptions: {
          input: {
            app: resolve("src/renderer/index.html"),
          },
        },
      },
      resolve: {
        alias: {
          "@renderer": resolve("src/renderer/src"),
        },
      },
      plugins: [vanillaExtractPlugin(), react()],
    },
  };
});
