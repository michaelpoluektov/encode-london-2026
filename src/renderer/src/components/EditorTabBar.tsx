import type { JSX } from "react";
import { getPathBasename } from "../../../shared/path-utils";
import { cx } from "../lib/cx";
import {
  tab,
  tabActive,
  tabBar,
  tabBell,
  tabClose,
  tabLabel,
} from "./editor-tab-bar.css";
import { CloseIcon, MagnifyingGlassIcon } from "./ui/icons";

type EditorTabBarProps = {
  readonly openTabPaths: string[];
  readonly selectedEntryPath: string | null;
  readonly aiNotifiedTabs: string[];
  readonly onSelectTab: (path: string) => void;
  readonly onCloseTab: (path: string) => void;
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
        const name = getPathBasename(path);

        return (
          <div
            key={path}
            aria-selected={isActive}
            className={cx(tab, isActive && tabActive)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
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
              <span
                aria-hidden="true"
                className={tabBell}
                title="Modified by AI"
              >
                <MagnifyingGlassIcon size={10} />
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
              <CloseIcon size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
