import type { JSX, ReactNode } from "react";
import type { WorkspacePanelId, WorkspaceRegionId } from "../store/app-store";
import { Panel } from "./Panel";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Text } from "./ui/Text";
import { EmptyState, Well } from "./ui/Well";
import {
  workspaceRegionActions,
  workspaceRegionBody,
  workspaceRegionEmpty,
  workspaceRegionHeader,
  workspaceRegionTab,
  workspaceRegionTabs,
} from "./workspace-region.css";

type WorkspaceRegionProps = {
  readonly activePanelId: WorkspacePanelId | null;
  readonly children: ReactNode;
  readonly panelIds: readonly WorkspacePanelId[];
  readonly region: WorkspaceRegionId;
  readonly renderPanelTitle: (panelId: WorkspacePanelId) => string;
  readonly onClosePanel: (panelId: WorkspacePanelId) => void;
  readonly onMovePanel: (
    panelId: WorkspacePanelId,
    region: WorkspaceRegionId,
  ) => void;
  readonly onSelectPanel: (panelId: WorkspacePanelId) => void;
};

const regionOptions: readonly WorkspaceRegionId[] = ["main", "side", "bottom"];

const regionLabels: Record<WorkspaceRegionId, string> = {
  bottom: "Bottom",
  main: "Main",
  side: "Side",
};

export const WorkspaceRegion = ({
  activePanelId,
  children,
  panelIds,
  region,
  renderPanelTitle,
  onClosePanel,
  onMovePanel,
  onSelectPanel,
}: WorkspaceRegionProps): JSX.Element => {
  const activePanelTitle =
    activePanelId === null ? undefined : renderPanelTitle(activePanelId);
  const hasTabs = panelIds.length > 1;

  return (
    <Panel
      actions={
        activePanelId === null ? null : (
          <div className={workspaceRegionActions}>
            <Select
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
                  {regionLabels[region]}
                </option>
              ))}
            </Select>
            <Button
              aria-label={`Close ${activePanelTitle}`}
              onClick={() => {
                onClosePanel(activePanelId);
              }}
              square
              variant="icon"
            >
              ×
            </Button>
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
            <Button
              key={panelId}
              active={activePanelId === panelId}
              className={workspaceRegionTab}
              onClick={() => {
                onSelectPanel(panelId);
              }}
              variant="tab"
            >
              {renderPanelTitle(panelId)}
            </Button>
          ))}
        </div>
      ) : null}
      {activePanelId === null ? (
        <EmptyState className={workspaceRegionEmpty}>
          <Well>
            <Text as="span" tone="muted" variant="label">
              Empty region
            </Text>
            <Text as="p" tone="secondary" variant="body">
              No panel is open in this workspace region.
            </Text>
          </Well>
        </EmptyState>
      ) : (
        children
      )}
    </Panel>
  );
};
