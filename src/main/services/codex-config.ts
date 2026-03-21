import type {
  CodexOptions,
  ModelReasoningEffort,
  ThreadOptions,
} from "@openai/codex-sdk";

export type ShadilyCodexConfig = {
  readonly model: string;
  readonly reasoningEffort: ModelReasoningEffort;
  readonly fastMode: boolean;
  readonly webSearch: boolean;
};

export const SHADILY_CODEX_CONFIG: ShadilyCodexConfig = {
  model: "gpt-5.4",
  reasoningEffort: "medium",
  fastMode: true,
  webSearch: false,
};

export const createCodexClientOptions = (
  mcpPort: number | null,
): CodexOptions => {
  const config: NonNullable<CodexOptions["config"]> = {};

  if (SHADILY_CODEX_CONFIG.fastMode) {
    config.service_tier = "fast";
  }

  if (mcpPort !== null) {
    config.mcp_servers = {
      "shadily-tools": {
        url: `http://127.0.0.1:${mcpPort}/mcp`,
      },
    };
  }

  return { config };
};

export const createCodexThreadOptions = (
  workingDirectory: string,
): ThreadOptions => ({
  additionalDirectories: [],
  approvalPolicy: "never",
  model: SHADILY_CODEX_CONFIG.model,
  modelReasoningEffort: SHADILY_CODEX_CONFIG.reasoningEffort,
  sandboxMode: "workspace-write",
  webSearchMode: SHADILY_CODEX_CONFIG.webSearch ? "live" : "disabled",
  workingDirectory,
});
