declare module "monaco-editor/esm/vs/base/browser/ui/scrollbar/scrollableElement.js" {
  export type DomScrollableElementOptions = {
    readonly className?: string;
    readonly consumeMouseWheelIfScrollbarIsNeeded?: boolean;
    readonly horizontal?: number;
    readonly horizontalScrollbarSize?: number;
    readonly horizontalSliderSize?: number;
    readonly useShadows?: boolean;
    readonly vertical?: number;
    readonly verticalScrollbarSize?: number;
    readonly verticalSliderSize?: number;
  };

  export class DomScrollableElement {
    public constructor(
      element: HTMLElement,
      options?: DomScrollableElementOptions,
    );

    public dispose(): void;
    public getDomNode(): HTMLElement;
    public scanDomNode(): void;
  }
}
