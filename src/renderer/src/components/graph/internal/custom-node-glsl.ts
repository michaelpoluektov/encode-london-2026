import type { GraphSourceLoader } from "../graph-types";
import { type GlslValueType, SUPPORTED_GLSL_TYPES } from "./glsl-type-registry";
import type { CustomNode } from "./json-schema";

export type ParsedGlslFunctionSignature = {
  readonly inputTypes: ReadonlyMap<string, GlslValueType>;
  readonly name: string;
  readonly outputType: GlslValueType;
};

const supportedGlslTypeSet = new Set<GlslValueType>(SUPPORTED_GLSL_TYPES);

const glslFunctionPattern =
  /\b(?<returnType>[A-Za-z_]\w*)\s+(?<name>[A-Za-z_]\w*)\s*\((?<parameters>[^)]*)\)\s*\{/g;

const exampleNodeSourceLoaders = import.meta.glob("../example/nodes/*.glsl", {
  import: "default",
  query: "?raw",
});

const normalizeExampleNodePath = (filepath: string): string | null => {
  const normalizedFilePath = filepath.replace(/\\/g, "/");
  const nodePathIndex = normalizedFilePath.indexOf("/nodes/");

  if (normalizedFilePath.startsWith("./nodes/")) {
    return normalizedFilePath;
  }

  if (nodePathIndex >= 0) {
    return `.${normalizedFilePath.slice(nodePathIndex)}`;
  }

  return null;
};

const loadExampleNodeSource = async (
  filepath: string,
): Promise<string | null> => {
  const normalizedFilePath = normalizeExampleNodePath(filepath);

  if (normalizedFilePath === null) {
    return null;
  }

  for (const [modulePath, loadModule] of Object.entries(
    exampleNodeSourceLoaders,
  )) {
    const normalizedModulePath = normalizeExampleNodePath(modulePath);

    if (normalizedModulePath === normalizedFilePath) {
      const source = await loadModule();

      return typeof source === "string" ? source : null;
    }
  }

  return null;
};

const parseParameter = (
  parameterSource: string,
): { name: string; type: GlslValueType } | null => {
  const parameterMatch = parameterSource
    .trim()
    .match(
      /^(?:(?:const|in|out|inout)\s+)?(?<type>[A-Za-z_]\w*)\s+(?<name>[A-Za-z_]\w*)$/,
    );

  if (
    parameterMatch?.groups?.type === undefined ||
    parameterMatch.groups.name === undefined
  ) {
    return null;
  }

  if (!supportedGlslTypeSet.has(parameterMatch.groups.type as GlslValueType)) {
    return null;
  }

  return {
    name: parameterMatch.groups.name,
    type: parameterMatch.groups.type as GlslValueType,
  };
};

export const formatFunctionSignature = (
  signature: ParsedGlslFunctionSignature,
): string => {
  const parameters = Array.from(signature.inputTypes.entries())
    .map(([name, type]) => `${type} ${name}`)
    .join(", ");

  return `${signature.outputType} ${signature.name}(${parameters})`;
};

export const parseFunctionSignatures = (
  source: string,
): ParsedGlslFunctionSignature[] => {
  const signatures: ParsedGlslFunctionSignature[] = [];

  for (const match of source.matchAll(glslFunctionPattern)) {
    const returnType = match.groups?.returnType;
    const name = match.groups?.name;
    const parameters = match.groups?.parameters;

    if (
      returnType === undefined ||
      name === undefined ||
      parameters === undefined ||
      !supportedGlslTypeSet.has(returnType as GlslValueType)
    ) {
      continue;
    }

    const inputTypes = new Map<string, GlslValueType>();
    const rawParameters = parameters
      .split(",")
      .map((parameter) => parameter.trim())
      .filter(Boolean);

    let hasInvalidParameter = false;

    for (const rawParameter of rawParameters) {
      const parsedParameter = parseParameter(rawParameter);

      if (parsedParameter === null) {
        hasInvalidParameter = true;
        break;
      }

      inputTypes.set(parsedParameter.name, parsedParameter.type);
    }

    if (hasInvalidParameter) {
      continue;
    }

    signatures.push({
      inputTypes,
      name,
      outputType: returnType as GlslValueType,
    });
  }

  return signatures;
};

export const getExpectedCustomNodeFunctionName = (node: CustomNode): string =>
  `${node.instanceName}Node`;

export const matchCustomNodeSignature = (
  node: CustomNode,
  source: string,
): {
  readonly availableFunctions: string;
  readonly expectedFunctionName: string;
  readonly signature: ParsedGlslFunctionSignature | null;
} => {
  const parsedFunctionSignatures = parseFunctionSignatures(source);
  const expectedFunctionName = getExpectedCustomNodeFunctionName(node);
  const signature =
    parsedFunctionSignatures.find(
      (candidate) => candidate.name === expectedFunctionName,
    ) ??
    (parsedFunctionSignatures.length === 1
      ? parsedFunctionSignatures[0]
      : null);

  return {
    availableFunctions:
      parsedFunctionSignatures.length > 0
        ? parsedFunctionSignatures.map(formatFunctionSignature).join(", ")
        : "none",
    expectedFunctionName,
    signature,
  };
};

export const loadResolvedCustomNodeSource = async (
  node: CustomNode,
  loadCustomNodeSource?: GraphSourceLoader,
): Promise<string> => {
  const loadSource =
    loadCustomNodeSource ??
    (async (filepath: string) => {
      const source = await loadExampleNodeSource(filepath);

      if (source === null) {
        throw new Error(
          `No source loader is configured for custom node file [${filepath}].`,
        );
      }

      return source;
    });

  return loadSource(node.filepath, node);
};
