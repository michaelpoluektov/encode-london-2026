import {
  type JSX,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type NodeRendererProps, Tree } from "react-arborist";
import type { ProjectTreeNode } from "../../../shared/contracts";
import { cx } from "../lib/cx";
import { useProjectStore } from "../store/project-store";
import {
  binaryGlyph,
  editableGlyph,
  emptyState,
  folderGlyph,
  imageGlyph,
  projectActions,
  projectActionsPrimary,
  projectActionsToggle,
  projectSection,
  projectSidebar,
  readOnlyGlyph,
  treeCaret,
  treeCaretHidden,
  treeClassName,
  treeGlyph,
  treeLabel,
  treeLabelGroup,
  treeRow,
  treeRowSelected,
  treeShell,
  treeViewport,
} from "./project-sidebar.css";
import { Button } from "./ui/Button";
import { textInputField } from "./ui/field.css";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentIcon,
  EyeIcon,
  EyeOffIcon,
  FileIcon,
  FolderClosedIcon,
  FolderOpenIcon,
  ImageFileIcon,
  PlusIcon,
  ReadOnlyFileIcon,
} from "./ui/icons";
import { Text } from "./ui/Text";

const getItemIcon = (node: ProjectTreeNode, isOpen: boolean): JSX.Element => {
  switch (node.itemKind) {
    case "directory":
      return (
        <span className={cx(treeGlyph, folderGlyph)}>
          {isOpen ? <FolderOpenIcon /> : <FolderClosedIcon />}
        </span>
      );
    case "editable":
      return (
        <span className={cx(treeGlyph, editableGlyph)}>
          <FileIcon />
        </span>
      );
    case "image":
      return (
        <span className={cx(treeGlyph, imageGlyph)}>
          <ImageFileIcon />
        </span>
      );
    case "binary":
      return (
        <span className={cx(treeGlyph, binaryGlyph)}>
          <DocumentIcon />
        </span>
      );
    case "readOnly":
      return (
        <span className={cx(treeGlyph, readOnlyGlyph)}>
          <ReadOnlyFileIcon />
        </span>
      );
  }
};

const ProjectTreeRow = ({
  node,
  style,
}: NodeRendererProps<ProjectTreeNode>): JSX.Element => (
  <div style={style}>
    <button
      className={cx(treeRow, node.isSelected && treeRowSelected)}
      type="button"
      onClick={() => {
        if (node.data.kind === "directory") {
          node.toggle();
          return;
        }

        node.select();
      }}
    >
      <span
        aria-hidden="true"
        className={cx(treeCaret, node.isLeaf && treeCaretHidden)}
      >
        {node.isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
      </span>
      {getItemIcon(node.data, node.isOpen)}
      <div className={treeLabelGroup}>
        <Text as="span" className={treeLabel} tone="default" variant="body">
          {node.data.name}
        </Text>
      </div>
    </button>
  </div>
);

const createInitialOpenState = (
  nodes: readonly ProjectTreeNode[],
): Record<string, boolean> =>
  Object.fromEntries(
    nodes.flatMap((node) => {
      if (node.kind !== "directory") {
        return [];
      }

      const isOpen = node.name !== "captures";

      return [
        [node.path, isOpen] as const,
        ...Object.entries(createInitialOpenState(node.children ?? [])),
      ];
    }),
  );

const HIDDEN_FILENAMES = new Set(["AGENTS.md", "shadily.json"]);
const HIDDEN_DIRECTORY_NAMES = new Set([".shadily", "docs"]);

const filterTreeNodes = (
  nodes: readonly ProjectTreeNode[],
  showHiddenFiles: boolean,
): ProjectTreeNode[] => {
  if (showHiddenFiles) {
    return [...nodes];
  }

  return nodes.flatMap((node) => {
    if (node.kind === "file") {
      return HIDDEN_FILENAMES.has(node.name) ? [] : [node];
    }

    if (HIDDEN_DIRECTORY_NAMES.has(node.name)) {
      return [];
    }

    const children = filterTreeNodes(node.children ?? [], showHiddenFiles);

    if (children.length === 0) {
      return [];
    }

    return [{ ...node, children }];
  });
};

export const ProjectSidebar = (): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const openProject = useProjectStore((s) => s.openProject);
  const selectEntry = useProjectStore((s) => s.selectEntry);

  const [pendingFolder, setPendingFolder] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [treeHeight, setTreeHeight] = useState(1);

  const treeViewportRef = useRef<HTMLDivElement | null>(null);
  const filteredTree = useMemo(
    () => filterTreeNodes(project?.tree ?? [], showHiddenFiles),
    [project?.tree, showHiddenFiles],
  );
  const initialOpenState = useMemo(
    () => createInitialOpenState(filteredTree),
    [filteredTree],
  );

  useEffect(() => {
    const viewport = treeViewportRef.current;

    if (viewport === null) {
      return;
    }

    setTreeHeight(
      Math.max(Math.floor(viewport.getBoundingClientRect().height), 1),
    );

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (entry !== undefined) {
        setTreeHeight(Math.max(Math.floor(entry.contentRect.height), 1));
      }
    });

    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleNewProject = async (): Promise<void> => {
    const folder = await window.shadily.project.pickFolder();
    if (folder !== null) {
      setPendingFolder(folder);
      setPendingName("my-shader");
    }
  };

  const handleCreateConfirm = async (): Promise<void> => {
    if (pendingFolder === null || pendingName.trim() === "") return;
    const result = await window.shadily.project.create(
      pendingFolder,
      pendingName.trim(),
    );
    setPendingFolder(null);
    setPendingName("");
    if (result !== null) {
      openProject(result);
    }
  };

  const handleCreateKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "Enter") {
      void handleCreateConfirm();
    } else if (event.key === "Escape") {
      setPendingFolder(null);
      setPendingName("");
    }
  };

  const handleOpenProject = async (): Promise<void> => {
    const result = await window.shadily.project.open();
    if (result !== null) {
      openProject(result);
    }
  };

  return (
    <div className={projectSidebar}>
      <section className={projectSection}>
        <div className={projectActions}>
          <div className={projectActionsPrimary}>
            <Button
              aria-label="Create project"
              onClick={() => {
                void handleNewProject();
              }}
              size="sm"
              variant="outline"
            >
              <PlusIcon />
              New
            </Button>
            <Button
              aria-label="Open project"
              onClick={() => {
                void handleOpenProject();
              }}
              size="sm"
              variant="outline"
            >
              <DocumentIcon />
              Open
            </Button>
          </div>
          <Button
            aria-label={
              showHiddenFiles ? "Hide hidden files" : "Show hidden files"
            }
            className={projectActionsToggle}
            onClick={() => {
              setShowHiddenFiles((visible) => !visible);
            }}
            size="sm"
            square
            variant="plain"
          >
            {showHiddenFiles ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
      </section>
      {pendingFolder !== null ? (
        <section className={projectSection}>
          <Text as="span" variant="label">
            New project name
          </Text>
          <input
            // biome-ignore lint/a11y/noAutofocus: intentional focus for inline input
            autoFocus
            className={textInputField}
            type="text"
            value={pendingName}
            onChange={(event) => setPendingName(event.target.value)}
            onKeyDown={handleCreateKeyDown}
          />
        </section>
      ) : null}

      <div className={treeShell}>
        <div ref={treeViewportRef} className={treeViewport}>
          {project !== null ? (
            <Tree<ProjectTreeNode>
              key={`${project.manifest.projectId}-${treeHeight}`}
              className={treeClassName}
              data={filteredTree}
              disableDrag
              disableEdit
              disableMultiSelection
              height={treeHeight}
              idAccessor="path"
              indent={20}
              initialOpenState={initialOpenState}
              overscanCount={8}
              padding={0}
              rowHeight={24}
              selection={project.selectedEntryPath ?? undefined}
              width="100%"
              onSelect={(nodes) => {
                const nextNode = nodes[0];

                if (nextNode?.data.kind === "file") {
                  selectEntry(nextNode.data.path);
                }
              }}
            >
              {ProjectTreeRow}
            </Tree>
          ) : (
            <div className={emptyState}>
              <Text as="p" tone="muted" variant="caption">
                The project tree appears here once a project is open.
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
