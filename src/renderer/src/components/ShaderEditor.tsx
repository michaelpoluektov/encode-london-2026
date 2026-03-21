import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { type JSX, useEffect, useRef, useState } from "react";
import {
  editorEmptyState,
  editorFrame,
  editorImageFrame,
  editorImagePreview,
} from "../app-shell.css";
import { GLSL_LANGUAGE_ID, registerGlslLanguage } from "../monaco-glsl";
import {
  createProjectSavePayload,
  getProjectDocument,
  getSavedProjectDocument,
  useProjectStore,
} from "../store/project-store";
import {
  darkThemeValues,
  defineShadilyMonacoTheme,
  SHADILY_MONACO_THEME,
} from "../theme";
import { Text } from "./ui/Text";

loader.config({ monaco });

const EmptyEditorState = ({
  body,
  title,
}: {
  body: string;
  title: string;
}): JSX.Element => (
  <div className={editorEmptyState}>
    <Text as="span" tone="default" variant="title">
      {title}
    </Text>
    <Text as="p" tone="muted" variant="caption">
      {body}
    </Text>
  </div>
);

export const ShaderEditor = (): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const setSavedDocument = useProjectStore((s) => s.setSavedDocument);
  const updateDraft = useProjectStore((s) => s.updateDraft);

  const [documentLoadState, setDocumentLoadState] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedEntryPath = project?.selectedEntryPath ?? null;
  const selectedDocument =
    project !== null && selectedEntryPath !== null
      ? getProjectDocument(project, selectedEntryPath)
      : null;

  useEffect(() => {
    if (project === null || selectedEntryPath === null) {
      setDocumentLoadState("idle");
      return;
    }

    if (getSavedProjectDocument(project, selectedEntryPath) !== null) {
      setDocumentLoadState("idle");
      return;
    }

    let cancelled = false;
    setDocumentLoadState("loading");

    void window.shadily.project
      .readEntry({
        folderPath: project.folderPath,
        manifest: project.manifest,
        path: selectedEntryPath,
      })
      .then((document) => {
        if (cancelled) {
          return;
        }

        setSavedDocument(document);
        setDocumentLoadState("idle");
      })
      .catch(() => {
        if (!cancelled) {
          setDocumentLoadState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project, selectedEntryPath, setSavedDocument]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const handleChange = (value: string | undefined): void => {
    if (
      value === undefined ||
      project === null ||
      selectedEntryPath === null ||
      selectedDocument === null ||
      selectedDocument.kind !== "text" ||
      !selectedDocument.isEditable
    ) {
      return;
    }

    updateDraft(selectedEntryPath, value);

    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const currentProject = useProjectStore.getState().project;

      if (currentProject === null) {
        return;
      }

      void window.shadily.project
        .save(createProjectSavePayload(currentProject))
        .then((savedProject) => {
          useProjectStore.getState().commitSavedProject(savedProject);
        })
        .catch(() => undefined);
    }, 1000);
  };

  if (project === null) {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="Open a project and choose a file from the tree to inspect or edit it."
          title="No file selected"
        />
      </div>
    );
  }

  if (selectedEntryPath === null) {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="This project does not have any selectable files yet."
          title="No file available"
        />
      </div>
    );
  }

  if (documentLoadState === "loading" && selectedDocument === null) {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="Loading the selected file from disk."
          title="Opening file"
        />
      </div>
    );
  }

  if (documentLoadState === "error") {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="The selected file could not be read."
          title="File unavailable"
        />
      </div>
    );
  }

  if (selectedDocument === null) {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="Choose a file from the project tree."
          title="No file selected"
        />
      </div>
    );
  }

  if (selectedDocument.kind === "binary") {
    return (
      <div className={editorFrame}>
        <EmptyEditorState
          body="This file is treated as binary, so it stays read-only and is not shown in Monaco."
          title="Binary file"
        />
      </div>
    );
  }

  if (selectedDocument.kind === "image") {
    return (
      <div className={editorImageFrame}>
        <img
          alt={selectedDocument.path}
          className={editorImagePreview}
          src={selectedDocument.sourceUrl}
        />
      </div>
    );
  }

  const editorPath = `file://${project.folderPath}/${selectedDocument.path}`;
  const language =
    selectedDocument.language === "glsl"
      ? GLSL_LANGUAGE_ID
      : selectedDocument.language;

  return (
    <div className={editorFrame}>
      <Editor
        beforeMount={(instance) => {
          registerGlslLanguage(instance);
          defineShadilyMonacoTheme(instance);
        }}
        height="100%"
        key={editorPath}
        language={language}
        path={editorPath}
        theme={SHADILY_MONACO_THEME}
        value={selectedDocument.content}
        onChange={handleChange}
        options={{
          fontFamily: darkThemeValues.font.family.mono,
          fontSize: Number.parseInt(darkThemeValues.font.size.sm, 10),
          minimap: { enabled: false },
          padding: {
            top: Number.parseInt(darkThemeValues.size.editorPaddingTop, 10),
          },
          readOnly: !selectedDocument.isEditable,
          roundedSelection: false,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};
