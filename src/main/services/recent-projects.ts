import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import {
  type AppConfig,
  appConfigSchema,
  type RecentProject,
} from "../../shared/contracts";

const getConfigPath = (): string =>
  join(app.getPath("userData"), "config.json");

const saveAppConfig = (config: AppConfig): void => {
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
};

export const getAppConfig = (): AppConfig => {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return { recentProjects: [] };
  }

  try {
    const raw = JSON.parse(readFileSync(configPath, "utf-8"));
    return appConfigSchema.parse(raw);
  } catch {
    return { recentProjects: [] };
  }
};

export const replaceRecentProjects = (
  recentProjects: readonly RecentProject[],
): void => {
  const config = getAppConfig();
  saveAppConfig({ ...config, recentProjects: [...recentProjects] });
};

export const addRecentProject = (entry: RecentProject): void => {
  const config = getAppConfig();
  const filtered = config.recentProjects.filter(
    (project) => project.path !== entry.path,
  );
  const recentProjects = [entry, ...filtered].slice(0, 10);
  saveAppConfig({ ...config, recentProjects });
};
