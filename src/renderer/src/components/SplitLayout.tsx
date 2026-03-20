import { Allotment } from "allotment";
import "allotment/dist/style.css";
import type { JSX, ReactNode } from "react";
import { splitLayout } from "./split-layout.css";

type SplitPaneDefinition = {
  readonly id: string;
  readonly content: ReactNode;
  readonly minSize?: number;
  readonly preferredSize?: number | `${number}px` | `${number}%`;
  readonly snap?: boolean;
};

type SplitLayoutProps = {
  readonly panes: readonly SplitPaneDefinition[];
  readonly defaultSizes?: readonly number[];
  readonly onChange?: (sizes: number[]) => void;
};

export const SplitLayout = ({
  panes,
  defaultSizes,
  onChange,
}: SplitLayoutProps): JSX.Element => {
  const allotmentDefaultSizes =
    defaultSizes === undefined ? undefined : [...defaultSizes];

  return (
    <div className={splitLayout}>
      <Allotment defaultSizes={allotmentDefaultSizes} onChange={onChange}>
        {panes.map((pane) => (
          <Allotment.Pane
            key={pane.id}
            minSize={pane.minSize}
            preferredSize={pane.preferredSize}
            snap={pane.snap}
          >
            {pane.content}
          </Allotment.Pane>
        ))}
      </Allotment>
    </div>
  );
};
