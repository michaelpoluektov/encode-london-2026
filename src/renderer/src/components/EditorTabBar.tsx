import type { JSX } from "react";
import { cx } from "../lib/cx";
import {
  tab,
  tabActive,
  tabBar,
  tabBell,
  tabClose,
  tabLabel,
} from "./editor-tab-bar.css";

type EditorTabBarProps = {
  readonly openTabPaths: string[];
  readonly selectedEntryPath: string | null;
  readonly aiNotifiedTabs: string[];
  readonly onSelectTab: (path: string) => void;
  readonly onCloseTab: (path: string) => void;
};

const getBasename = (path: string): string => {
  const parts = path.replaceAll("\\", "/").split("/");
  return parts[parts.length - 1] ?? path;
};

export const EditorTabBar = ({
  openTabPaths,
  selectedEntryPath,
  aiNotifiedTabs,
  onSelectTab,
  onCloseTab,
}: EditorTabBarProps): JSX.Element => {
  return (
    <div className={tabBar} role="tablist">
      {openTabPaths.map((path) => {
        const isActive = path === selectedEntryPath;
        const hasNotification = aiNotifiedTabs.includes(path);
        const name = getBasename(path);

        return (
          <div
            key={path}
            aria-selected={isActive}
            className={cx(tab, isActive && tabActive)}
            role="tab"
          >
            <button
              className={tabLabel}
              title={path}
              type="button"
              onClick={() => {
                onSelectTab(path);
              }}
            >
              {name}
            </button>
            {hasNotification ? (
              <span aria-label="AI modified" className={tabBell} title="Modified by AI">
                &#x1F514;
              </span>
            ) : null}
            <button
              aria-label={`Close ${name}`}
              className={tabClose}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(path);
              }}
            >
              &#xd7;
            </button>
          </div>
        );
      })}
    </div>
  );
};
