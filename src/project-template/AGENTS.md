# Shadily Shader Project

Use `graph.json` as the source of truth for the fragment graph, `nodes/*.glsl` for reusable GLSL functions, and `vertex.vert` for vertex work.

Consult `docs/` before making structural changes:

- `docs/graph-json-schema.md`
- `docs/glsl-programming-guide.md`
- `docs/glsl-node-parsing.md`
- `docs/graph-validation.md`
- `docs/examples/`

If the user is asking to change an existing shader pipeline, call `render_preview` before editing so you have a baseline. After shader changes, run `check_compilation`, then `render_preview` to verify the result.

Prefer small reusable nodes, graph-driven composition, and editable inputs over hardcoded constants. Nodes should be split into multiple files.
