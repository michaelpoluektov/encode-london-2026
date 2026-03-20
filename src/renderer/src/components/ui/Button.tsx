import type { ButtonHTMLAttributes, JSX } from "react";
import { cx } from "../../lib/cx";
import {
  buttonActive,
  buttonBase,
  buttonSize,
  buttonSquare,
  buttonVariant,
} from "./button.css";

type ButtonSize = keyof typeof buttonSize;
type ButtonVariant = keyof typeof buttonVariant;

type ButtonProps = {
  readonly active?: boolean;
  readonly size?: ButtonSize;
  readonly square?: boolean;
  readonly variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({
  active = false,
  className,
  size = "sm",
  square = false,
  type = "button",
  variant = "outline",
  ...props
}: ButtonProps): JSX.Element => (
  <button
    {...props}
    className={cx(
      buttonBase,
      buttonSize[size],
      buttonVariant[variant],
      active && buttonActive,
      square && buttonSquare[size],
      className,
    )}
    type={type}
  />
);
