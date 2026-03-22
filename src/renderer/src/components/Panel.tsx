import type { JSX, ReactNode } from "react";
import { cx } from "../lib/cx";
import { panel, panelBody } from "./panel.css";

type PanelProps = {
  readonly children?: ReactNode;
  readonly label: string;
  readonly bodyClassName?: string;
};

export const Panel = ({
  children,
  label,
  bodyClassName,
}: PanelProps): JSX.Element => {
  const bodyClassNames = cx(panelBody, bodyClassName);

  return (
    <section aria-label={`${label} panel`} className={panel}>
      <div className={bodyClassNames}>{children}</div>
    </section>
  );
};
