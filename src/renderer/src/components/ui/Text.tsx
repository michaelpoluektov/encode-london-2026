import type { JSX, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { text, textTone, textVariant } from "./text.css";

type TextElement = "div" | "h1" | "h2" | "p" | "span" | "strong";
type TextTone = keyof typeof textTone;
type TextVariant = keyof typeof textVariant;

type TextProps = {
  readonly as?: TextElement;
  readonly children: ReactNode;
  readonly className?: string;
  readonly tone?: TextTone;
  readonly variant?: TextVariant;
};

export const Text = ({
  as = "span",
  children,
  className,
  tone,
  variant = "body",
}: TextProps): JSX.Element => {
  const Component = as;

  return (
    <Component
      className={cx(
        text,
        textVariant[variant],
        tone ? textTone[tone] : undefined,
        className,
      )}
    >
      {children}
    </Component>
  );
};
