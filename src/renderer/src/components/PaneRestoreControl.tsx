import type { JSX } from "react";
import { cx } from "../lib/cx";
import {
  paneRestoreButton,
  paneRestoreControl,
  paneRestoreLabel,
  paneRestorePlacement,
  paneRestorePlacementButton,
} from "./pane-restore-control.css";
import { Button } from "./ui/Button";
import { ChevronRightIcon } from "./ui/icons";

type PaneRestorePlacement = keyof typeof paneRestorePlacement;

type PaneRestoreControlProps = {
  readonly label: string;
  readonly placement: PaneRestorePlacement;
  readonly restoreIcon?: JSX.Element;
  readonly onRestore: () => void;
};

export const PaneRestoreControl = ({
  label,
  placement,
  restoreIcon = <ChevronRightIcon size={12} />,
  onRestore,
}: PaneRestoreControlProps): JSX.Element => {
  const showsBarLabel = placement !== "leftCenter";

  return (
    <div className={cx(paneRestoreControl, paneRestorePlacement[placement])}>
      <Button
        aria-label={`Expand ${label}`}
        className={cx(paneRestoreButton, paneRestorePlacementButton[placement])}
        onClick={onRestore}
        size="xs"
        variant="plain"
      >
        {showsBarLabel ? (
          <span className={paneRestoreLabel}>{label}</span>
        ) : null}
        {restoreIcon}
      </Button>
    </div>
  );
};
