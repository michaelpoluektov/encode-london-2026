import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import type { BrowserWindow } from "electron";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

type CompileResult = { success: boolean; error?: string };
type CaptureResult = { dataUrl: string } | { error: string };

const pendingCompileChecks = new Map<
  string,
  (result: CompileResult) => void
>();
const pendingCaptures = new Map<string, (result: CaptureResult) => void>();

const REQUEST_TIMEOUT_MS = 15_000;

export const resolveCompileCheck = (
  requestId: string,
  result: CompileResult,
): void => {
  pendingCompileChecks.get(requestId)?.(result);
  pendingCompileChecks.delete(requestId);
};

export const resolveCapture = (
  requestId: string,
  result: CaptureResult,
): void => {
  pendingCaptures.get(requestId)?.(result);
  pendingCaptures.delete(requestId);
};

let mainWindow: BrowserWindow | null = null;

export const setMainWindow = (win: BrowserWindow | null): void => {
  mainWindow = win;
};

const requestCompileCheck = (): Promise<CompileResult> =>
  new Promise((resolve) => {
    const requestId = randomUUID();
    const timer = setTimeout(() => {
      pendingCompileChecks.delete(requestId);
      resolve({ success: false, error: "Compile check timed out." });
    }, REQUEST_TIMEOUT_MS);

    pendingCompileChecks.set(requestId, (result) => {
      clearTimeout(timer);
      resolve(result);
    });

    if (mainWindow === null || mainWindow.isDestroyed()) {
      clearTimeout(timer);
      pendingCompileChecks.delete(requestId);
      resolve({ success: false, error: "Preview window unavailable." });
      return;
    }

    mainWindow.webContents.send("preview:compile-check", requestId);
  });

const requestCaptureAt = (uTime: number | null): Promise<CaptureResult> =>
  new Promise((resolve) => {
    const requestId = randomUUID();
    const timer = setTimeout(() => {
      pendingCaptures.delete(requestId);
      resolve({ error: "Capture timed out." });
    }, REQUEST_TIMEOUT_MS);

    pendingCaptures.set(requestId, (result) => {
      clearTimeout(timer);
      resolve(result);
    });

    if (mainWindow === null || mainWindow.isDestroyed()) {
      clearTimeout(timer);
      pendingCaptures.delete(requestId);
      resolve({ error: "Preview window unavailable." });
      return;
    }

    mainWindow.webContents.send("preview:capture-at", requestId, uTime);
  });

/** Create a fresh McpServer with tools registered — needed because each
 *  stateless request requires its own McpServer + Transport pair. */
const createMcpServerInstance = (): McpServer => {
  const server = new McpServer({
    name: "shadily-tools",
    version: "1.0.0",
  });

  server.registerTool(
    "check_compilation",
    {
      description:
        "Check whether the current fragment/vertex shaders compile successfully in the preview viewport.",
      inputSchema: {},
    },
    async () => {
      const result = await requestCompileCheck();
      if (result.success) {
        return {
          content: [{ type: "text" as const, text: "Shaders compiled successfully." }],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: `Compilation failed: ${result.error ?? "unknown error"}`,
          },
        ],
        isError: true,
      };
    },
  );

  server.registerTool(
    "render_preview",
    {
      description:
        "Render the shader preview and return it as an image. Optionally set u_time to a specific value.",
      inputSchema: {
        u_time: z
          .number()
          .optional()
          .describe("Time value in seconds for the u_time uniform."),
      },
    },
    async (args) => {
      const result = await requestCaptureAt(args.u_time ?? null);
      if ("error" in result) {
        return {
          content: [
            { type: "text" as const, text: `Capture failed: ${result.error}` },
          ],
          isError: true,
        };
      }
      const base64Data = result.dataUrl.replace(
        /^data:image\/png;base64,/,
        "",
      );
      return {
        content: [
          {
            type: "image" as const,
            data: base64Data,
            mimeType: "image/png",
          },
        ],
      };
    },
  );

  return server;
};

export const startMcpServer = async (): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    const httpServer = createServer(async (req, res) => {
      console.log(`[mcp-server] ${req.method} ${req.url}`);
      const url = req.url ?? "";
      if (!url.startsWith("/mcp")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      if (
        req.method !== "POST" &&
        req.method !== "GET" &&
        req.method !== "DELETE"
      ) {
        res.writeHead(405);
        res.end();
        return;
      }
      // Stateless mode: fresh McpServer + transport per request.
      const server = createMcpServerInstance();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      try {
        await server.connect(transport);
        await transport.handleRequest(req, res);
        await server.close();
      } catch (err: unknown) {
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal server error");
        }
        console.error("[mcp-server] request error:", err);
      }
    });

    httpServer.listen(0, "127.0.0.1", () => {
      const address = httpServer.address();
      const port =
        typeof address === "object" && address !== null ? address.port : 0;
      console.log(
        `[mcp-server] MCP server listening on http://127.0.0.1:${port}/mcp`,
      );
      resolve(port);
    });

    httpServer.on("error", reject);
  });
