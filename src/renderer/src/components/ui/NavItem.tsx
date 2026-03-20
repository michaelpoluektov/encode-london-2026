import type { JSX } from "react";
import { cx } from "../../lib/cx";
import { navItem, navItemActive } from "./nav-item.css";
import { Text } from "./Text";

type NavItemProps = {
  readonly active?: boolean;
  readonly subtitle?: string;
  readonly title: string;
};

export const NavItem = ({
  active = false,
  subtitle,
  title,
}: NavItemProps): JSX.Element => (
  <div className={cx(navItem, active && navItemActive)}>
    <Text as="span" tone={active ? "default" : "secondary"} variant="body">
      {title}
    </Text>
    {subtitle ? (
      <Text as="span" tone="muted" variant="code">
        {subtitle}
      </Text>
    ) : null}
  </div>
);
