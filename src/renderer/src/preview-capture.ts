export type PreviewCaptureResult =
  | {
      readonly kind: "success";
      readonly dataUrl: string;
    }
  | {
      readonly kind: "error";
      readonly message: string;
    };

type PreviewCaptureHandler = () => Promise<PreviewCaptureResult>;

let activePreviewCaptureHandler: PreviewCaptureHandler | null = null;

export const registerPreviewCaptureHandler = (
  handler: PreviewCaptureHandler,
): (() => void) => {
  activePreviewCaptureHandler = handler;

  return () => {
    if (activePreviewCaptureHandler === handler) {
      activePreviewCaptureHandler = null;
    }
  };
};

export const captureRegisteredPreview =
  async (): Promise<PreviewCaptureResult> => {
    if (activePreviewCaptureHandler === null) {
      return {
        kind: "error",
        message: "Preview capture is unavailable.",
      };
    }

    return activePreviewCaptureHandler();
  };
