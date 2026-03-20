# Requirements

## Goal

Build a desktop shader editor for material shaders with AI assistance, using modern libraries and a scope that is realistic for a short hackathon build.

ShaderFrog is a reference for product direction only. See `.references/editor`, `.references/core`, and `.references/glsl-parser`.

## V1

V1 is the hackathon deliverable.

It should include:

- an Electron desktop app
- a code-first editing workflow for material shaders
- live `three.js` preview for a material on a small set of preview meshes
- local project open/save
- visible compile/runtime diagnostics
- AI integration through `codex` that can read and edit project files
- AI-triggered render/capture so the agent can use visual output as context

V1 should be optimised for a convincing end-to-end demo, not feature completeness.

V1 does not require:

- a full ShaderFrog-equivalent graph workflow
- multi-engine support
- cloud features
- collaboration features
- broad asset-management features

## V2

V2 is the first expansion after the hackathon.

It should add:

- a graph editor suitable for demoing shader structure visually
- a coherent relationship between code editing and graph editing
- AI operations that can inspect and edit the graph as well as source files
- richer project structure and better operational tooling around history, captures, and iteration

The graph editor should be added in a way that does not force a rewrite of the V1 editor.

## AI Capabilities

Across V1 and V2, the AI integration should be able to:

- read project context
- edit project files
- trigger a render
- include rendered images in context

In V2, the AI should also be able to inspect and edit the graph representation.

## References

Use `.references` as the source of implementation ideas and prior art:

- `.references/editor` for ShaderFrog product workflows and UI concepts
- `.references/core` for graph/compiler ideas
- `.references/glsl-parser` for GLSL parsing and transformation support
- `.references/codex` for Codex integration patterns
