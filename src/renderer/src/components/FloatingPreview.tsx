import {
  type CSSProperties,
  type JSX,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  PREVIEW_MODELS,
  type PreviewModelId,
} from "../../../shared/default-project";
import {
  createProjectSavePayload,
  useProjectStore,
} from "../store/project-store";
import {
  dragHandle,
  expandButton,
  floatingPanel,
  gripIcon,
  modelSelect,
  previewBody,
} from "./floating-preview.css";
import { PreviewFullscreen } from "./PreviewFullscreen";
import { PreviewViewport } from "./PreviewViewport";
import { ExpandIcon, GripIcon } from "./ui/icons";

type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const PANEL_WIDTH = 340;
const PANEL_HEIGHT = 220;
const SNAP_INSET = 16;

const SNAP_TRANSITION = "top 0.18s, left 0.18s, right 0.18s, bottom 0.18s";

const getCornerStyle = (corner: Corner): CSSProperties => {
  switch (corner) {
    case "topLeft":
      return {
        top: SNAP_INSET,
        left: SNAP_INSET,
        right: "unset",
        bottom: "unset",
      };
    case "topRight":
      return {
        top: SNAP_INSET,
        right: SNAP_INSET,
        left: "unset",
        bottom: "unset",
      };
    case "bottomLeft":
      return {
        bottom: SNAP_INSET,
        left: SNAP_INSET,
        right: "unset",
        top: "unset",
      };
    case "bottomRight":
      return {
        bottom: SNAP_INSET,
        right: SNAP_INSET,
        left: "unset",
        top: "unset",
      };
  }
};

type FloatingPreviewProps = {
  readonly containerRef: RefObject<HTMLDivElement | null>;
};

export const FloatingPreview = ({
  containerRef,
}: FloatingPreviewProps): JSX.Element => {
  const project = useProjectStore((s) => s.project);
  const previewMesh = project?.manifest.preview.mesh ?? "sphere";
  const updatePreviewMesh = useProjectStore((s) => s.updatePreviewMesh);

  const handleSelectMesh = useCallback(
    (mesh: PreviewModelId) => {
      updatePreviewMesh(mesh);
      setTimeout(() => {
        const p = useProjectStore.getState().project;
        if (!p) return;
        void window.shadily.project
          .save(createProjectSavePayload(p))
          .then((saved) =>
            useProjectStore.getState().commitSavedProject(saved),
          );
      }, 0);
    },
    [updatePreviewMesh],
  );

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [corner, setCorner] = useState<Corner>("bottomRight");
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ top: number; left: number } | null>(
    null,
  );
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    panelTop: number;
    panelLeft: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();
      const cs = getCornerStyle(corner);

      // Resolve current top/left from corner style
      const initTop =
        cs.bottom !== "unset" && cs.bottom !== undefined
          ? containerHeight - PANEL_HEIGHT - (cs.bottom as number)
          : (cs.top as number);
      const initLeft =
        cs.right !== "unset" && cs.right !== undefined
          ? containerWidth - PANEL_WIDTH - (cs.right as number)
          : (cs.left as number);

      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panelTop: initTop,
        panelLeft: initLeft,
      };
      setDragPos({ top: initTop, left: initLeft });
      setDragging(true);
    },
    [corner, containerRef],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      setDragPos({
        top: start.panelTop + (e.clientY - start.mouseY),
        left: start.panelLeft + (e.clientX - start.mouseX),
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      const start = dragStartRef.current;
      const container = containerRef.current;

      if (!start || !container) {
        setDragging(false);
        setDragPos(null);
        return;
      }

      const finalTop = start.panelTop + (e.clientY - start.mouseY);
      const finalLeft = start.panelLeft + (e.clientX - start.mouseX);
      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();

      const panelCenterX = finalLeft + PANEL_WIDTH / 2;
      const panelCenterY = finalTop + PANEL_HEIGHT / 2;
      const midX = containerWidth / 2;
      const midY = containerHeight / 2;

      const newCorner: Corner =
        panelCenterX < midX
          ? panelCenterY < midY
            ? "topLeft"
            : "bottomLeft"
          : panelCenterY < midY
            ? "topRight"
            : "bottomRight";

      setCorner(newCorner);
      setDragging(false);
      setDragPos(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, containerRef]);

  const style: CSSProperties =
    dragging && dragPos !== null
      ? {
          top: dragPos.top,
          left: dragPos.left,
          right: "unset",
          bottom: "unset",
          transition: "none",
        }
      : {
          ...getCornerStyle(corner),
          transition: SNAP_TRANSITION,
        };

  return (
    <>
      <div className={floatingPanel} style={style}>
        <button
          className={dragHandle}
          onMouseDown={handleMouseDown}
          type="button"
        >
          <span aria-hidden="true" className={gripIcon}>
            <GripIcon />
          </span>
          Preview
          {project !== null && (
            <select
              className={modelSelect}
              value={previewMesh}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onChange={(e) => {
                handleSelectMesh(e.currentTarget.value as PreviewModelId);
              }}
            >
              {PREVIEW_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
          <button
            aria-label="Open fullscreen preview"
            className={expandButton}
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={() => {
              setIsFullscreen(true);
            }}
          >
            <ExpandIcon />
          </button>
        </button>
        <div className={previewBody}>
          <PreviewViewport />
        </div>
      </div>
      {isFullscreen ? (
        <PreviewFullscreen
          onClose={() => {
            setIsFullscreen(false);
          }}
        />
      ) : null}
    </>
  );
};
