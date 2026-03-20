import type { JSX } from "react";
import { statusBadge, statusLabel, statusTone } from "./status-badge.css";

type StatusTone = keyof typeof statusTone;

type StatusBadgeProps = {
  readonly label: string;
  readonly value: string;
  readonly tone?: StatusTone;
};

export const StatusBadge = ({
  label,
  value,
  tone = "neutral",
}: StatusBadgeProps): JSX.Element => (
  <div className={[statusBadge, statusTone[tone]].join(" ")}>
    <span className={statusLabel}>{label}</span>
    <strong>{value}</strong>
  </div>
);
