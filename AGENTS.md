## DevOps guidance

- For every code change request, create a new branch and a worktree in `.worktrees/`
- After finishing a feature implementation, run type checker and linter, then ask a subagent to review the changes before merging
- Keep reference code and documentation (libraries that implement similar features, potential dependencies etc.) in `.references`. Read documentation/implementation details from there, rather than using web search too often. If you need to reference something, clone the appropriate repository/documentation in `.references`.

## Code quality guidelines

- Full type annotations across application code
- Prefer a functional/declarative style when applicable
- Strict linter/formatter setup
- Prefer modelling recoverable failures as typed result values rather than exception-driven control flow
- Use a structured concurrency helper when applicable, keep detached background tasks explicit and narrowly scoped
- All external boundaries validated with `zod`
- All state should have a single source of truth
- Invalid state should not be representable if possible

## Review guidelines

- Verify that code quality guidelines above are met
- If a large part of the code base is implemented in an existing library, bring it up in review and suggest a refactor.
- To keep things maintainable, prefer not adding more code whenever possible. Refactors should usually reduce the logic/complexity of the code base.
