# Shadily

You are developing an LLM enabled shader editor. Details in `REQUIREMENTS.md` and `ARCHITECTURE.md`.

## DevOps guidance

- After finishing a feature implementation, run type checker and linter, then review changes against review guidelines.
- Keep reference code and documentation (libraries that implement similar features, potential dependencies etc.) in `.references`. Read documentation/implementation details from there, rather than using web search too often. If you need to reference something, clone the appropriate repository/documentation in `.references`.

## Code quality guidelines

- Full type annotations across application code
- Prefer a functional/declarative style when applicable
- Strict linter/formatter setup
- Re-use existing shared components, theme tokens, and layout primitives before creating new UI code
- If a screen needs a new UI treatment, extend the shared component or token set first rather than introducing feature-local controls/text styles
- Prefer modelling recoverable failures as typed result values rather than exception-driven control flow
- Use a structured concurrency helper when applicable, keep detached background tasks explicit and narrowly scoped
- All external boundaries validated with `zod`
- All state should have a single source of truth
- Invalid state should not be representable if possible

## Shader editing workflow

When editing shaders, always follow this workflow:

1. **Before making changes**: Call `render_preview` to see the current state of the shader output. This gives you a baseline to compare against.
2. **Make your code changes** to the shader files.
3. **Check compilation**: Call `check_compilation` to verify the shaders compile without errors. Fix any compilation errors before proceeding.
4. **After changes compile**: Call `render_preview` again to verify the visual output matches what was requested. Compare against the baseline from step 1.

If the preview doesn't look right, iterate on the changes and repeat steps 2–4.

## Review guidelines

- Verify that code quality guidelines above are met
- Treat duplicated UI patterns, feature-local styling of standard controls/text, and bypassing shared primitives as review findings
- If a large part of the code base is implemented in an existing library, bring it up in review and suggest a refactor.
- To keep things maintainable, prefer not adding more code whenever possible. Refactors should usually reduce the logic/complexity of the code base.
