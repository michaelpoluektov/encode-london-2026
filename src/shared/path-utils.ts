export const normalizeProjectPath = (path: string): string =>
  path.replaceAll("\\", "/");

export const getPathSegments = (path: string): string[] =>
  normalizeProjectPath(path)
    .split("/")
    .filter((segment) => segment.length > 0);

export const getPathBasename = (path: string): string =>
  getPathSegments(path).at(-1) ?? path;
