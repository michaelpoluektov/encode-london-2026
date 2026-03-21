type PreviewCaptureHandler = () => Promise<string | null>;

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

export const captureRegisteredPreview = async (): Promise<string | null> => {
  if (activePreviewCaptureHandler === null) {
    return null;
  }

  return activePreviewCaptureHandler();
};
