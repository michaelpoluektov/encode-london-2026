import type { JSX, ReactNode } from "react";
import type { WorkspacePanelId, WorkspaceRegionId } from "../store/app-store";
import { Panel } from "./Panel";
import {
  workspaceRegionActions,
  workspaceRegionBody,
  workspaceRegionButton,
  workspaceRegionEmpty,
  workspaceRegionHeader,
  workspaceRegionSelect,
  workspaceRegionTab,
  workspaceRegionTabActive,
  workspaceRegionTabs,
} from "./workspace-region.css";

type WorkspaceRegionProps = {
  readonly activePanelId: WorkspacePanelId | null;
  readonly children: ReactNode;
  readonly panelIds: readonly WorkspacePanelId[];
  readonly region: WorkspaceRegionId;
  readonly regionLabel: string;
  readonly renderPanelTitle: (panelId: WorkspacePanelId) => string;
  readonly onClosePanel: (panelId: WorkspacePanelId) => void;
  readonly onMovePanel: (
    panelId: WorkspacePanelId,
    region: WorkspaceRegionId,
  ) => void;
  readonly onSelectPanel: (panelId: WorkspacePanelId) => void;
};

const regionOptions: readonly WorkspaceRegionId[] = ["main", "side", "bottom"];

export const WorkspaceRegion = ({
  activePanelId,
  children,
  panelIds,
  region,
  regionLabel,
  renderPanelTitle,
  onClosePanel,
  onMovePanel,
  onSelectPanel,
}: WorkspaceRegionProps): JSX.Element => {
  const activePanelTitle =
    activePanelId === null ? "Empty" : renderPanelTitle(activePanelId);
  const hasTabs = panelIds.length > 1;

  return (
    <Panel
      eyebrow={regionLabel}
      actions={
        activePanelId === null ? null : (
          <div className={workspaceRegionActions}>
            <select
              className={workspaceRegionSelect}
              onChange={(event) => {
                onMovePanel(
                  activePanelId,
                  event.currentTarget.value as WorkspaceRegionId,
                );
              }}
              value={region}
            >
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            <button
              aria-label={`Close ${activePanelTitle}`}
              className={workspaceRegionButton}
              onClick={() => {
                onClosePanel(activePanelId);
              }}
              type="button"
            >
              X
            </button>
          </div>
        )
      }
      headerClassName={workspaceRegionHeader}
      title={activePanelTitle}
      bodyClassName={
        hasTabs ? workspaceRegionBody.tabbed : workspaceRegionBody.single
      }
    >
      {hasTabs ? (
        <div className={workspaceRegionTabs}>
          {panelIds.map((panelId) => (
            <button
              key={panelId}
              className={[
                workspaceRegionTab,
                activePanelId === panelId ? workspaceRegionTabActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                onSelectPanel(panelId);
              }}
              type="button"
            >
              {renderPanelTitle(panelId)}
            </button>
          ))}
        </div>
      ) : null}
      {activePanelId === null ? (
        <div className={workspaceRegionEmpty}>No panel open in this region</div>
      ) : (
        children
      )}
    </Panel>
  );
};
