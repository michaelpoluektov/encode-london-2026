import type { JSX, ReactNode } from "react";
import { cx } from "../lib/cx";
import {
  panel,
  panelBody,
  panelHeader,
  panelTitle,
  panelTitleBlock,
  panelTone,
} from "./panel.css";
import { Text } from "./ui/Text";

type PanelTone = keyof typeof panelTone;

type PanelProps = {
  readonly children: ReactNode;
  readonly title?: string;
  readonly actions?: ReactNode;
  readonly tone?: PanelTone;
  readonly bodyClassName?: string;
  readonly headerClassName?: string;
};

export const Panel = ({
  children,
  title,
  actions,
  tone = "default",
  bodyClassName,
  headerClassName,
}: PanelProps): JSX.Element => {
  const hasHeader = title !== undefined || actions !== undefined;
  const bodyClassNames = cx(panelBody, bodyClassName);
  const headerClassNames = cx(panelHeader, headerClassName);

  return (
    <section className={cx(panel, panelTone[tone])}>
      {hasHeader ? (
        <header className={headerClassNames}>
          <div className={panelTitleBlock}>
            {title ? (
              <Text as="h2" className={panelTitle} variant="title">
                {title}
              </Text>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={bodyClassNames}>{children}</div>
    </section>
  );
};
