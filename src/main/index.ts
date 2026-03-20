import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { bootstrapPayloadSchema } from "../shared/contracts";
import { getCodexRuntimeState } from "./services/codex-runtime";

if (process.platform === "linux") {
  // Prefer Chromium's Ozone backend so Wayland sessions use the native path.
  app.commandLine.appendSwitch("enable-features", "UseOzonePlatform");
  app.commandLine.appendSwitch("ozone-platform-hint", "auto");
}

const createMainWindow = async (): Promise<BrowserWindow> => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#0b1020",
    title: "Shadily",
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
    },
  });

  await mainWindow.loadURL(
    process.env.ELECTRON_RENDERER_URL ??
      `file://${join(__dirname, "../renderer/index.html")}`,
  );

  return mainWindow;
};

app.whenReady().then(async () => {
  ipcMain.handle("app:get-bootstrap-payload", () =>
    bootstrapPayloadSchema.parse({
      appName: "Shadily",
      platform: process.platform,
      codex: getCodexRuntimeState(),
    }),
  );

  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
