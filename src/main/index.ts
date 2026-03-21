import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import {
  bootstrapPayloadSchema,
  chatProjectRequestSchema,
  chatSendPayloadSchema,
  chatThreadRequestSchema,
  historyListRequestSchema,
  historyRevertRequestSchema,
  projectCreatePayloadSchema,
  projectEntryRequestSchema,
  projectFolderPathSchema,
  projectLayoutRequestSchema,
  projectLayoutSavePayloadSchema,
  projectSaveCapturePayloadSchema,
  projectSavePayloadSchema,
} from "../shared/contracts";
import * as chatService from "./services/chat-service";
import * as codexRuntime from "./services/codex-runtime";
import * as mcpServer from "./services/mcp-server";
import * as projectService from "./services/project-service";

let mainWindow: BrowserWindow | null = null;

if (process.platform === "linux") {
  // Prefer Chromium's Ozone backend so Wayland sessions use the native path.
  app.commandLine.appendSwitch("enable-features", "UseOzonePlatform");
  app.commandLine.appendSwitch("ozone-platform-hint", "auto");
}

const isToggleDevToolsShortcut = (input: Electron.Input): boolean => {
  if (input.type !== "keyDown") {
    return false;
  }

  if (input.key === "F12") {
    return true;
  }

  return (
    input.key.toLowerCase() === "i" &&
    (input.control || input.meta) &&
    input.shift
  );
};

const createMainWindow = async (): Promise<BrowserWindow> => {
  const win = new BrowserWindow({
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
  win.removeMenu();
  win.webContents.on("before-input-event", (event, input) => {
    if (!isToggleDevToolsShortcut(input)) {
      return;
    }

    event.preventDefault();
    win.webContents.toggleDevTools();
  });

  mainWindow = win;
  mcpServer.setMainWindow(win);

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
      mcpServer.setMainWindow(null);
    }
  });

  await win.loadURL(
    process.env.ELECTRON_RENDERER_URL ??
      `file://${join(__dirname, "../renderer/index.html")}`,
  );

  return win;
};

app.whenReady().then(async () => {
  // Start MCP server so tools are ready before any Codex thread is created.
  mcpServer
    .startMcpServer()
    .then((port) => codexRuntime.setMcpPort(port))
    .catch((err: unknown) =>
      console.error("[mcp-server] Failed to start:", err),
    );

  // Preview IPC: renderer responds to compile-check requests from MCP tools.
  ipcMain.handle(
    "preview:compile-check-result",
    (
      _e,
      payload: {
        requestId: string;
        result: { success: boolean; error?: string };
      },
    ) => {
      mcpServer.resolveCompileCheck(payload.requestId, payload.result);
    },
  );

  // Preview IPC: renderer responds to capture-at requests from MCP tools.
  ipcMain.handle(
    "preview:capture-at-result",
    (
      _e,
      payload: { requestId: string; dataUrl: string | null; error?: string },
    ) => {
      if (payload.dataUrl !== null) {
        mcpServer.resolveCapture(payload.requestId, {
          dataUrl: payload.dataUrl,
        });
      } else {
        mcpServer.resolveCapture(payload.requestId, {
          error: payload.error ?? "Capture failed.",
        });
      }
    },
  );

  // History IPC: list checkpoints for a thread.
  ipcMain.handle("history:listCheckpoints", async (_e, payload: unknown) => {
    const parsed = historyListRequestSchema.parse(payload);
    return chatService.listThreadCheckpoints(parsed);
  });

  // History IPC: revert project files to a checkpoint + truncate chat history.
  ipcMain.handle("history:revert", async (_e, payload: unknown) => {
    const parsed = historyRevertRequestSchema.parse(payload);
    return chatService.revertToCheckpoint(parsed);
  });

  ipcMain.handle("app:get-bootstrap-payload", async () => {
    const initialProject = await projectService.openMostRecentProject();

    return bootstrapPayloadSchema.parse({
      appName: "Shadily",
      platform: process.platform,
      codex: codexRuntime.getCodexRuntimeState(),
      initialProject,
    });
  });

  ipcMain.handle("project:pickFolder", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle("project:create", async (_e, payload: unknown) => {
    const parsedPayload = projectCreatePayloadSchema.parse(payload);
    const result = await projectService.createProject(
      parsedPayload.parentDir,
      parsedPayload.name,
    );
    return result;
  });

  ipcMain.handle("project:open", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (canceled) return null;
    return projectService.openProject(filePaths[0]);
  });

  ipcMain.handle("project:save", async (_e, payload: unknown) => {
    const parsedPayload = projectSavePayloadSchema.parse(payload);
    return projectService.saveProject(
      parsedPayload.folderPath,
      parsedPayload.manifest,
      parsedPayload.graphSource,
      parsedPayload.vertexSource,
    );
  });

  ipcMain.handle("project:saveCapture", async (_e, payload: unknown) => {
    const parsedPayload = projectSaveCapturePayloadSchema.parse(payload);
    return projectService.saveCapture(parsedPayload);
  });

  ipcMain.handle("project:reload", (_e, payload: unknown) =>
    projectService.reloadProject(projectFolderPathSchema.parse(payload)),
  );

  ipcMain.handle("project:readEntry", (_e, payload: unknown) =>
    projectService.readProjectEntry(projectEntryRequestSchema.parse(payload)),
  );

  ipcMain.handle("project:getLayout", async (_e, payload: unknown) => {
    const parsedPayload = projectLayoutRequestSchema.parse(payload);
    return projectService.readProjectLayout(parsedPayload.projectId);
  });

  ipcMain.handle("project:saveLayout", async (_e, payload: unknown) => {
    const parsedPayload = projectLayoutSavePayloadSchema.parse(payload);
    await projectService.writeProjectLayout(
      parsedPayload.projectId,
      parsedPayload.layout,
    );
  });

  ipcMain.handle("chat:listThreads", async (_event, payload: unknown) => {
    const parsedPayload = chatProjectRequestSchema.parse(payload);
    return chatService.listProjectThreads(parsedPayload.projectId);
  });

  ipcMain.handle("chat:getActiveThread", async (_event, payload: unknown) => {
    const parsedPayload = chatProjectRequestSchema.parse(payload);
    return chatService.getActiveThread(parsedPayload);
  });

  ipcMain.handle("chat:createThread", async (_event, payload: unknown) => {
    const parsedPayload = chatProjectRequestSchema.parse(payload);
    return chatService.createThread(parsedPayload);
  });

  ipcMain.handle("chat:switchThread", async (_event, payload: unknown) => {
    const parsedPayload = chatThreadRequestSchema.parse(payload);
    return chatService.switchThread(parsedPayload);
  });

  ipcMain.handle("chat:deleteThread", async (_event, payload: unknown) => {
    const parsedPayload = chatThreadRequestSchema.parse(payload);
    return chatService.deleteThread(parsedPayload);
  });

  ipcMain.handle("chat:send", async (event, payload: unknown) => {
    const parsedPayload = chatSendPayloadSchema.parse(payload);
    return chatService.sendMessage(
      parsedPayload,
      (text) => event.sender.send("chat:chunk", text),
      (changes) => event.sender.send("chat:file-change", changes),
    );
  });

  ipcMain.handle("chat:stop", () => {
    chatService.stopActiveTurn();
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
