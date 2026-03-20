import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import type { ProjectSavePayload } from "../shared/contracts";
import { bootstrapPayloadSchema } from "../shared/contracts";
import * as codexRuntime from "./services/codex-runtime";
import * as projectService from "./services/project-service";

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
      codex: codexRuntime.getCodexRuntimeState(),
    }),
  );

  ipcMain.handle("project:pickFolder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle(
    "project:create",
    async (_e, parentDir: string, name: string) => {
      const result = await projectService.createProject(parentDir, name);
      if (result) codexRuntime.startSession(result.folderPath);
      return result;
    },
  );

  ipcMain.handle("project:open", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (canceled) return null;
    const result = await projectService.openProject(filePaths[0]);
    if (result) codexRuntime.startSession(result.folderPath);
    return result;
  });

  ipcMain.handle("project:save", async (_e, payload: ProjectSavePayload) => {
    await projectService.saveProject(
      payload.folderPath,
      payload.manifest,
      payload.shaders,
    );
  });

  ipcMain.handle("project:openPath", async (_e, folderPath: string) => {
    const result = await projectService.openProject(folderPath);
    if (result) codexRuntime.startSession(result.folderPath);
    return result;
  });

  ipcMain.handle("project:getRecents", () =>
    projectService.getRecentProjects(),
  );

  ipcMain.handle("chat:send", async (event, prompt: string) => {
    await codexRuntime.sendMessage(
      prompt,
      (text) => event.sender.send("chat:chunk", text),
      (changes) => event.sender.send("chat:file-change", changes),
    );
  });

  ipcMain.handle("chat:stop", () => {
    codexRuntime.stopSession();
  });

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
