import { Allotment } from "allotment";
import "allotment/dist/style.css";
import type { JSX, ReactNode } from "react";
import { splitLayout } from "./split-layout.css";

type SplitPaneDefinition = {
  readonly id: string;
  readonly content: ReactNode;
  readonly maxSize?: number;
  readonly minSize?: number;
  readonly preferredSize?: number | `${number}px` | `${number}%`;
  readonly snap?: boolean;
  readonly visible?: boolean;
};

type SplitLayoutProps = {
  readonly panes: readonly SplitPaneDefinition[];
  readonly defaultSizes?: readonly number[];
  readonly onChange?: (sizes: number[]) => void;
  readonly orientation?: "horizontal" | "vertical";
};

export const SplitLayout = ({
  panes,
  defaultSizes,
  onChange,
  orientation = "horizontal",
}: SplitLayoutProps): JSX.Element => {
  const allotmentDefaultSizes =
    defaultSizes === undefined ? undefined : [...defaultSizes];

  return (
    <div className={splitLayout}>
      <Allotment
        defaultSizes={allotmentDefaultSizes}
        onChange={onChange}
        vertical={orientation === "vertical"}
      >
        {panes.map((pane) => (
          <Allotment.Pane
            key={pane.id}
            maxSize={pane.maxSize}
            minSize={pane.minSize}
            preferredSize={pane.preferredSize}
            snap={pane.snap}
            visible={pane.visible}
          >
            {pane.content}
          </Allotment.Pane>
        ))}
      </Allotment>
    </div>
  );
};
