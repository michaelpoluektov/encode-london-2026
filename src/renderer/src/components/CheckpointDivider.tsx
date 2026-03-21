import { type JSX, useCallback, useRef, useState } from "react";
import type {
  GraphPreviewSnapshot,
  ProjectCheckpoint,
} from "../../../shared/contracts";
import { useChatStore } from "../store/chat-store";
import { useGraphPreviewStore } from "../store/graph-preview-store";
import {
  chatCheckpointActions,
  chatCheckpointButton,
  chatCheckpointDivider,
  chatCheckpointLine,
} from "./chat-panel.css";
import { CloseIcon, MagnifyingGlassIcon, UndoIcon } from "./ui/icons";

export const CheckpointDivider = ({
  checkpoint,
}: {
  checkpoint: ProjectCheckpoint;
}): JSX.Element => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const revertToCheckpoint = useChatStore((s) => s.revertToCheckpoint);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const savedPreviewSnapshotRef = useRef<GraphPreviewSnapshot | null>(null);

  const restoreSavedPreviewSnapshot = useCallback(() => {
    const store = useGraphPreviewStore.getState();
    const savedPreviewSnapshot = savedPreviewSnapshotRef.current;

    if (savedPreviewSnapshot === null) {
      store.clearCompiledGraphShader();
    } else {
      store.setCompiledGraphShader(
        savedPreviewSnapshot.fragmentShaderSource,
        savedPreviewSnapshot.uniformValues,
      );
    }

    savedPreviewSnapshotRef.current = null;
  }, []);

  const handlePreviewToggle = useCallback(() => {
    const store = useGraphPreviewStore.getState();

    if (isPreviewing) {
      restoreSavedPreviewSnapshot();
      setIsPreviewing(false);
    } else if (checkpoint.previewSnapshot !== null) {
      savedPreviewSnapshotRef.current = store.previewSnapshot;
      store.setCompiledGraphShader(
        checkpoint.previewSnapshot.fragmentShaderSource,
        checkpoint.previewSnapshot.uniformValues,
      );
      setIsPreviewing(true);
    }
  }, [checkpoint.previewSnapshot, isPreviewing, restoreSavedPreviewSnapshot]);

  const handleRevert = async () => {
    if (isReverting || isGenerating) return;

    if (isPreviewing) {
      restoreSavedPreviewSnapshot();
      setIsPreviewing(false);
    }

    setIsReverting(true);
    try {
      await revertToCheckpoint(checkpoint.id);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className={chatCheckpointDivider}>
      <div className={chatCheckpointLine} />
      <div className={chatCheckpointActions}>
        {checkpoint.previewSnapshot !== null && (
          <button
            aria-label={isPreviewing ? "Stop preview" : "Preview checkpoint"}
            className={chatCheckpointButton}
            onClick={handlePreviewToggle}
            title={
              isPreviewing
                ? "Restore current shader"
                : "Preview shader at this checkpoint"
            }
            type="button"
          >
            {isPreviewing ? (
              <CloseIcon size={12} />
            ) : (
              <MagnifyingGlassIcon size={12} />
            )}
          </button>
        )}
        <button
          aria-label="Revert to checkpoint"
          className={chatCheckpointButton}
          disabled={isReverting || isGenerating}
          onClick={() => void handleRevert()}
          title="Revert project files to this checkpoint"
          type="button"
        >
          {isReverting ? "…" : <UndoIcon size={12} />}
        </button>
      </div>
      <div className={chatCheckpointLine} />
    </div>
  );
};
