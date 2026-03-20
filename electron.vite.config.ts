import { resolve } from "node:path";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const standaloneReactDevToolsPlugin = {
  name: "standalone-react-devtools",
  apply: "serve" as const,
  transformIndexHtml(html: string) {
    const transformedHtml = html.replace(
      "script-src 'self' 'unsafe-eval';",
      "script-src 'self' 'unsafe-eval' http://localhost:8097;",
    );

    return {
      html: transformedHtml,
      tags: [
        {
          tag: "script",
          attrs: {
            src: "http://localhost:8097",
          },
          injectTo: "head-prepend" as const,
        },
      ],
    };
  },
};

export default defineConfig(() => {
  const enableReactDevTools = process.env.ENABLE_REACT_DEVTOOLS === "true";

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
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
      plugins: [
        ...(enableReactDevTools ? [standaloneReactDevToolsPlugin] : []),
        vanillaExtractPlugin(),
        react(),
      ],
    },
  };
});
