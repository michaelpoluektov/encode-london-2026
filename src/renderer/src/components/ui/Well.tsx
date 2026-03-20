import type { JSX, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { emptyState, well, wellTone } from "./well.css";

type WellTone = keyof typeof wellTone;

type WellProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: WellTone;
};

type EmptyStateProps = {
  readonly children: ReactNode;
  readonly className?: string;
};

export const Well = ({
  children,
  className,
  tone = "inset",
}: WellProps): JSX.Element => (
  <div className={cx(well, wellTone[tone], className)}>{children}</div>
);

export const EmptyState = ({
  children,
  className,
}: EmptyStateProps): JSX.Element => (
  <div className={cx(emptyState, className)}>{children}</div>
);
