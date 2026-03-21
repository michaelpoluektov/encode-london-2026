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
import { Panel } from "./Panel";
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
import { Button } from "./ui/Button";
import { textInputField } from "./ui/field.css";
import { Stack } from "./ui/Stack";
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

  const actions = (
    <Stack direction="row" gap={2}>
      <Button size="sm" onClick={() => void handleNewProject()}>
        New
      </Button>
      <Button size="sm" onClick={() => void handleOpenProject()}>
        Open
      </Button>
    </Stack>
  );

  return (
    <Panel
      collapseSymbol="<"
      label="Project"
      onToggleCollapsed={onToggleCollapsed}
    >
      <div className={projectSidebar}>
        <section className={projectSection}>{actions}</section>
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
