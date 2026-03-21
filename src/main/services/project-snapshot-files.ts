import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { normalizeProjectPath } from "../../shared/path-utils";

const SNAPSHOTTABLE_TEXT_EXTENSIONS = new Set([
  ".glsl",
  ".frag",
  ".vert",
  ".js",
  ".ts",
  ".json",
  ".txt",
  ".yaml",
  ".yml",
  ".toml",
  ".md",
]);

const isSnapshotCandidate = (entryName: string): boolean =>
  SNAPSHOTTABLE_TEXT_EXTENSIONS.has(extname(entryName).toLowerCase());

export const listProjectSnapshotPaths = async (
  folderPath: string,
): Promise<string[]> => {
  const result: string[] = [];

  const walk = async (dir: string): Promise<void> => {
    let entries: string[];

    try {
      entries = await readdir(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") {
        continue;
      }

      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath).catch(() => null);

      if (entryStat === null) {
        continue;
      }

      if (entryStat.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!isSnapshotCandidate(entry)) {
        continue;
      }

      result.push(
        normalizeProjectPath(fullPath).replace(
          `${normalizeProjectPath(folderPath)}/`,
          "",
        ),
      );
    }
  };

  await walk(folderPath);

  return result;
};

export const readProjectSnapshotFiles = async (
  folderPath: string,
): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  const snapshotPaths = await listProjectSnapshotPaths(folderPath);

  for (const relativePath of snapshotPaths) {
    const fullPath = join(folderPath, relativePath);
    const content = await readFile(fullPath, "utf-8").catch(() => null);

    if (content !== null) {
      result[relativePath] = content;
    }
  }

  return result;
};
