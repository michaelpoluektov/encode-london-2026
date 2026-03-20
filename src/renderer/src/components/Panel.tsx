import type { JSX, ReactNode } from "react";
import {
  panel,
  panelBody,
  panelEyebrow,
  panelHeader,
  panelTitle,
  panelTitleBlock,
  panelTone,
} from "./panel.css";

type PanelTone = keyof typeof panelTone;

type PanelProps = {
  readonly children: ReactNode;
  readonly eyebrow?: string;
  readonly title?: string;
  readonly actions?: ReactNode;
  readonly tone?: PanelTone;
  readonly bodyClassName?: string;
};

export const Panel = ({
  children,
  eyebrow,
  title,
  actions,
  tone = "default",
  bodyClassName,
}: PanelProps): JSX.Element => {
  const hasHeader =
    eyebrow !== undefined || title !== undefined || actions !== undefined;
  const bodyClassNames = [panelBody, bodyClassName].filter(Boolean).join(" ");

  return (
    <section className={[panel, panelTone[tone]].join(" ")}>
      {hasHeader ? (
        <header className={panelHeader}>
          <div className={panelTitleBlock}>
            {eyebrow ? <p className={panelEyebrow}>{eyebrow}</p> : null}
            {title ? <h2 className={panelTitle}>{title}</h2> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={bodyClassNames}>{children}</div>
    </section>
  );
};
