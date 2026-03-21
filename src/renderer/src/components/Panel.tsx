import type { JSX, ReactNode } from "react";
import { cx } from "../lib/cx";
import {
  panel,
  panelBody,
  panelHeader,
  panelHeaderControls,
  panelHeaderLabel,
} from "./panel.css";
import { Button } from "./ui/Button";
import { MinusIcon } from "./ui/icons";

export type PanelHeaderAction = {
  readonly ariaLabel: string;
  readonly disabled?: boolean;
  readonly key: string;
  readonly onClick: () => void;
  readonly content: ReactNode;
};

type PanelProps = {
  readonly children?: ReactNode;
  readonly label: string;
  readonly collapseDisabled?: boolean;
  readonly collapseSymbol?: ReactNode;
  readonly headerActions?: readonly PanelHeaderAction[];
  readonly onToggleCollapsed?: () => void;
  readonly bodyClassName?: string;
  readonly headerClassName?: string;
};

export const Panel = ({
  children,
  label,
  collapseDisabled = false,
  collapseSymbol = <MinusIcon />,
  headerActions = [],
  onToggleCollapsed,
  bodyClassName,
  headerClassName,
}: PanelProps): JSX.Element => {
  const hasHeader = onToggleCollapsed != null || headerActions.length > 0;
  const bodyClassNames = cx(panelBody, bodyClassName);
  const headerClassNames = cx(panelHeader, headerClassName);
  const toggleButton =
    onToggleCollapsed === undefined ? null : (
      <Button
        aria-label={`Collapse ${label}`}
        disabled={collapseDisabled}
        onClick={onToggleCollapsed}
        size="sm"
        square
        variant="plain"
      >
        {collapseSymbol}
      </Button>
    );
  const actionButtons = headerActions.map((action) => (
    <Button
      key={action.key}
      aria-label={action.ariaLabel}
      disabled={action.disabled}
      onClick={action.onClick}
      size="sm"
      square
      variant="plain"
    >
      {action.content}
    </Button>
  ));

  return (
    <section aria-label={`${label} panel`} className={panel}>
      {hasHeader ? (
        <header className={headerClassNames}>
          <div className={panelHeaderControls}>
            <span className={panelHeaderLabel}>{label}</span>
            {actionButtons}
          </div>
          {toggleButton}
        </header>
      ) : null}
      <div className={bodyClassNames}>{children}</div>
    </section>
  );
};
