import { type JSX, useCallback, useRef, useState } from "react";
import type { ProjectCheckpoint } from "../../../shared/contracts";
import { useChatStore } from "../store/chat-store";
import { useGraphPreviewStore } from "../store/graph-preview-store";
import {
  chatCheckpointActions,
  chatCheckpointButton,
  chatCheckpointDivider,
  chatCheckpointLine,
} from "./chat-panel.css";

export const CheckpointDivider = ({
  checkpoint,
}: {
  checkpoint: ProjectCheckpoint;
}): JSX.Element => {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const revertToCheckpoint = useChatStore((s) => s.revertToCheckpoint);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const savedShaderRef = useRef<string | null>(null);

  const handlePreviewToggle = useCallback(() => {
    const store = useGraphPreviewStore.getState();
    if (isPreviewing) {
      // Restore original shader
      if (savedShaderRef.current !== null) {
        store.setCompiledGraphShader(savedShaderRef.current, {});
      } else {
        store.clearCompiledGraphShader();
      }
      savedShaderRef.current = null;
      setIsPreviewing(false);
    } else if (checkpoint.fragmentShaderSource !== null) {
      // Save current shader and swap in checkpoint shader
      savedShaderRef.current = store.fragmentShaderSource;
      store.setCompiledGraphShader(checkpoint.fragmentShaderSource, {});
      setIsPreviewing(true);
    }
  }, [checkpoint.fragmentShaderSource, isPreviewing]);

  const handleRevert = async () => {
    if (isReverting || isGenerating) return;
    // If previewing, restore before reverting
    if (isPreviewing) {
      const store = useGraphPreviewStore.getState();
      if (savedShaderRef.current !== null) {
        store.setCompiledGraphShader(savedShaderRef.current, {});
      } else {
        store.clearCompiledGraphShader();
      }
      savedShaderRef.current = null;
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
        {checkpoint.fragmentShaderSource !== null && (
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
            {isPreviewing ? "✕" : "👁"}
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
          {isReverting ? "…" : "↩"}
        </button>
      </div>
      <div className={chatCheckpointLine} />
    </div>
  );
};
