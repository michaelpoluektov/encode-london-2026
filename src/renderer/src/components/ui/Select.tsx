import type { JSX, SelectHTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import { selectBase, selectSize } from "./select.css";

type SelectSize = "md" | "sm";

type SelectProps = {
  readonly controlSize?: SelectSize;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({
  className,
  controlSize = "sm",
  ...props
}: SelectProps): JSX.Element => (
  <select
    {...props}
    className={cx(selectBase, selectSize[controlSize], className)}
  />
);
