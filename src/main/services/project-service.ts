import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import {
  type AppConfig,
  appConfigSchema,
  type ProjectOpenResult,
  type RecentProject,
  type ShadilyManifest,
  shadilyManifestSchema,
} from "../../shared/contracts";

const DEFAULT_FRAGMENT_SHADER = `uniform float u_time;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(color, 1.0);
}`;

const DEFAULT_VERTEX_SHADER = `varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const getConfigPath = (): string =>
  join(app.getPath("userData"), "config.json");

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

const saveAppConfig = (config: AppConfig): void => {
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), "utf-8");
};

export const addRecentProject = (entry: RecentProject): void => {
  const config = getAppConfig();
  const filtered = config.recentProjects.filter((p) => p.path !== entry.path);
  const recentProjects = [entry, ...filtered].slice(0, 10);
  saveAppConfig({ ...config, recentProjects });
};

export const getRecentProjects = (): RecentProject[] =>
  getAppConfig().recentProjects;

export const createProject = async (
  parentDir: string,
  name: string,
): Promise<ProjectOpenResult> => {
  const folderPath = join(parentDir, name);
  mkdirSync(folderPath, { recursive: true });
  mkdirSync(join(folderPath, "captures"), { recursive: true });

  const now = new Date().toISOString();
  const manifest: ShadilyManifest = {
    name,
    version: "1",
    shaders: { fragment: "material.frag", vertex: "material.vert" },
    preview: { mesh: "torusKnot" },
    created: now,
    modified: now,
  };

  writeFileSync(
    join(folderPath, "shadily.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );
  writeFileSync(
    join(folderPath, "material.frag"),
    DEFAULT_FRAGMENT_SHADER,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, "material.vert"),
    DEFAULT_VERTEX_SHADER,
    "utf-8",
  );

  addRecentProject({ name, path: folderPath });

  return {
    folderPath,
    manifest,
    shaders: {
      fragment: DEFAULT_FRAGMENT_SHADER,
      vertex: DEFAULT_VERTEX_SHADER,
    },
  };
};

export const openProject = async (
  folderPath: string,
): Promise<ProjectOpenResult> => {
  const manifestRaw = JSON.parse(
    readFileSync(join(folderPath, "shadily.json"), "utf-8"),
  );
  const manifest = shadilyManifestSchema.parse(manifestRaw);

  const fragment = readFileSync(
    join(folderPath, manifest.shaders.fragment),
    "utf-8",
  );
  const vertex = readFileSync(
    join(folderPath, manifest.shaders.vertex),
    "utf-8",
  );

  addRecentProject({ name: manifest.name, path: folderPath });

  return { folderPath, manifest, shaders: { fragment, vertex } };
};

export const readShaders = (
  folderPath: string,
  manifest: ShadilyManifest,
): { fragment: string; vertex: string } => {
  const fragment = readFileSync(
    join(folderPath, manifest.shaders.fragment),
    "utf-8",
  );
  const vertex = readFileSync(
    join(folderPath, manifest.shaders.vertex),
    "utf-8",
  );
  return { fragment, vertex };
};

export const saveProject = async (
  folderPath: string,
  manifest: ShadilyManifest,
  shaders: { fragment: string; vertex: string },
): Promise<void> => {
  const updated: ShadilyManifest = {
    ...manifest,
    modified: new Date().toISOString(),
  };
  writeFileSync(
    join(folderPath, manifest.shaders.fragment),
    shaders.fragment,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, manifest.shaders.vertex),
    shaders.vertex,
    "utf-8",
  );
  writeFileSync(
    join(folderPath, "shadily.json"),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
};
