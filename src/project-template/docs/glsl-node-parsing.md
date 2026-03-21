# Custom GLSL Node Parsing And Validation

These excerpts mirror the implementation used by the app that implements the tools.

## Signature parsing and matching

```ts
const supportedGlslTypeSet = new Set<GlslValueType>(SUPPORTED_GLSL_TYPES);

const glslFunctionPattern =
  /\b(?<returnType>[A-Za-z_]\w*)\s+(?<name>[A-Za-z_]\w*)\s*\((?<parameters>[^)]*)\)\s*\{/g;

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
```

## Source loading and validation outcome

```ts
const inferCustomNodeData = async (
  node: CustomNode,
  loadCustomNodeSource: GraphSourceLoader | undefined,
): Promise<
  | { readonly data: InferredCustomNodeData; readonly errors: readonly [] }
  | { readonly data: null; readonly errors: readonly string[] }
> => {
  let source: string;

  try {
    source = await loadResolvedCustomNodeSource(node, loadCustomNodeSource);
  } catch (error) {
    return {
      data: null,
      errors: [
        `node [${node.instanceName}] could not load custom node source from [${node.filepath}] to infer its input and output types. ${error instanceof Error ? error.message : "Unknown error."}`,
      ],
    };
  }

  const { availableFunctions, expectedFunctionName, signature } =
    matchCustomNodeSignature(node, source);

  if (signature === null) {
    return {
      data: null,
      errors: [
        `node [${node.instanceName}] could not infer a custom node signature from [${node.filepath}]. Expected a function named [${expectedFunctionName}] or a file with exactly one supported GLSL function. Available functions: ${availableFunctions}.`,
      ],
    };
  }

  return {
    data: {
      signature,
      source: source.trim(),
    },
    errors: [],
  };
};
```
