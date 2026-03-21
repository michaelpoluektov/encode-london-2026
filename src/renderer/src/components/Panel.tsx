import type { JSX, ReactNode } from "react";
import { cx } from "../lib/cx";
import { panel, panelBody, panelHeader, panelTone } from "./panel.css";
import { Button } from "./ui/Button";

type PanelTone = keyof typeof panelTone;

type PanelProps = {
  readonly children?: ReactNode;
  readonly label: string;
  readonly collapseDisabled?: boolean;
  readonly collapseSymbol?: string;
  readonly onToggleCollapsed?: () => void;
  readonly tone?: PanelTone;
  readonly bodyClassName?: string;
  readonly headerClassName?: string;
};

export const Panel = ({
  children,
  label,
  collapseDisabled = false,
  collapseSymbol = "-",
  onToggleCollapsed,
  tone = "default",
  bodyClassName,
  headerClassName,
}: PanelProps): JSX.Element => {
  const hasHeader = onToggleCollapsed != null;
  const bodyClassNames = cx(panelBody, bodyClassName);
  const headerClassNames = cx(panelHeader, headerClassName);
  const toggleButton =
    onToggleCollapsed === undefined ? null : (
      <Button
        aria-label={`Collapse ${label}`}
        disabled={collapseDisabled}
        onClick={onToggleCollapsed}
        size="xs"
        square
        variant="plain"
      >
        {collapseSymbol}
      </Button>
    );

  return (
    <section
      aria-label={`${label} panel`}
      className={cx(panel, panelTone[tone])}
    >
      {hasHeader ? (
        <header className={headerClassNames}>{toggleButton}</header>
      ) : null}
      <div className={bodyClassNames}>{children}</div>
    </section>
  );
};
