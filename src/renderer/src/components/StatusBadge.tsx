import type { JSX } from "react";
import { statusBadge, statusLabel, statusTone } from "./status-badge.css";
import { Text } from "./ui/Text";

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
    <Text as="span" className={statusLabel} variant="label">
      {label}
    </Text>
    <Text as="strong" tone="default" variant="caption">
      {value}
    </Text>
  </div>
);
