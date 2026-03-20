# Architecture Notes

## Purpose

This document describes the intended system shape. It does not restate product scope; see [REQUIREMENTS.md](/home/michael/Projects/encode-london-2026/REQUIREMENTS.md).

## Core Direction

- Electron desktop app
- `three.js` only
- local-first project workflow
- AI integration through `codex`
- architecture that supports a code-first V1 and leaves room for a graph-editor V2

## V1 Shape

V1 should be organised around a regular editor rather than a graph compiler.

The main subsystems are:

- desktop shell
- project/filesystem layer
- shader code editor
- preview/render service
- AI runtime and tool boundary

The canonical project state in V1 should be file-based and simple enough to keep the app easy to reason about.

## V2 Shape

V2 may introduce a graph editor, but it should be additive to the V1 architecture.

That means:

- the graph layer should sit beside the existing editor model, not replace the whole app
- rendering and AI services should remain reusable
- any graph implementation should avoid ShaderFrog's dual mutable graph/canvas state pattern

## Reference Use

Use ShaderFrog and related sources selectively:

- `.references/editor` for workflow and UI reference
- `.references/core` for graph/compiler ideas, not as a package to adopt wholesale
- `.references/glsl-parser` as a likely dependency or adaptation source for GLSL parsing and transforms
- `.references/codex` for Codex SDK and app-server reference material

## Explicit Non-Direction

Do not treat ShaderFrog as a scaffold source.

Do not adopt:

- the old Next.js app shape
- the full multi-engine plugin model
- the monolithic editor container pattern
- the dual mutable graph/flow state approach

If a graph editor is added later, it should fit the app rather than forcing the app to fit ShaderFrog.
