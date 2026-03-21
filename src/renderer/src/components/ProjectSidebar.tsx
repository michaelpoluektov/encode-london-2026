import {
  type JSX,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { type NodeRendererProps, Tree } from "react-arborist";
import type { ProjectTreeNode } from "../../../shared/contracts";
import { cx } from "../lib/cx";
import { useProjectStore } from "../store/project-store";
import { Panel, type PanelHeaderAction } from "./Panel";
import {
  binaryGlyph,
  editableGlyph,
  emptyState,
  folderGlyph,
  imageGlyph,
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
import { textInputField } from "./ui/field.css";
import { Text } from "./ui/Text";

const getGlyphClassName = (node: ProjectTreeNode): string => {
  switch (node.itemKind) {
    case "directory":
      return folderGlyph;
    case "editable":
      return editableGlyph;
    case "image":
      return imageGlyph;
    case "binary":
      return binaryGlyph;
    case "readOnly":
      return readOnlyGlyph;
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
        {node.isLeaf ? ">" : node.isOpen ? "v" : ">"}
      </span>
      <span
        aria-hidden="true"
        className={cx(treeGlyph, getGlyphClassName(node.data))}
      />
      <div className={treeLabelGroup}>
        <Text as="span" className={treeLabel} tone="default" variant="body">
          {node.data.name}
        </Text>
      </div>
    </button>
  </div>
);

const NewProjectIcon = (): JSX.Element => (
  <svg aria-hidden="true" fill="none" height="8" viewBox="0 0 12 12" width="8">
    <path
      d="M6 2v8M2 6h8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.25"
    />
  </svg>
);

const OpenProjectIcon = (): JSX.Element => (
  <svg aria-hidden="true" fill="none" height="8" viewBox="0 0 12 12" width="8">
    <path
      d="M3 1.75h4l2 2v6.5H3z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
    <path
      d="M7 1.75v2h2"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.25"
    />
  </svg>
);

type ProjectSidebarProps = {
  readonly onToggleCollapsed: () => void;
};

export const ProjectSidebar = ({
  onToggleCollapsed,
}: ProjectSidebarProps): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const openProject = useProjectStore((s) => s.openProject);
  const selectEntry = useProjectStore((s) => s.selectEntry);

  const [pendingFolder, setPendingFolder] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [treeHeight, setTreeHeight] = useState(1);

  const treeViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = treeViewportRef.current;

    if (viewport === null) {
      return;
    }

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
  const headerActions: readonly PanelHeaderAction[] = [
    {
      ariaLabel: "Create project",
      content: <NewProjectIcon />,
      key: "new-project",
      onClick: () => {
        void handleNewProject();
      },
    },
    {
      ariaLabel: "Open project",
      content: <OpenProjectIcon />,
      key: "open-project",
      onClick: () => {
        void handleOpenProject();
      },
    },
  ];

  return (
    <Panel
      collapseSymbol="<"
      headerActions={headerActions}
      label="Project"
      onToggleCollapsed={onToggleCollapsed}
    >
      <div className={projectSidebar}>
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
                className={treeClassName}
                data={project.tree}
                disableDrag
                disableEdit
                disableMultiSelection
                height={treeHeight}
                idAccessor="path"
                indent={20}
                openByDefault
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
    </Panel>
  );
};
