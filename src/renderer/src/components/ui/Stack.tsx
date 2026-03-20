import type { CSSProperties, JSX, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { stackBase, stackDirection, stackGap } from "./stack.css";

type StackDirection = keyof typeof stackDirection;
type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type StackProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly direction?: StackDirection;
  readonly gap?: StackGap;
  readonly style?: CSSProperties;
};

export const Stack = ({
  children,
  className,
  direction = "column",
  gap = 4,
  style,
}: StackProps): JSX.Element => (
  <div
    className={cx(
      stackBase,
      stackDirection[direction],
      stackGap[gap],
      className,
    )}
    style={style}
  >
    {children}
  </div>
);
