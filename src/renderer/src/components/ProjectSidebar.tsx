import type { JSX } from "react";
import { Panel } from "./Panel";
import {
  projectItem,
  projectItemActive,
  projectItemName,
  projectItemPath,
  projectList,
  projectSection,
  projectSectionLabel,
  projectSidebar,
} from "./project-sidebar.css";

export const ProjectSidebar = (): JSX.Element => (
  <Panel title="Project">
    <div className={projectSidebar}>
      <section className={projectSection}>
        <span className={projectSectionLabel}>Workspace</span>
        <div className={projectList}>
          <div className={[projectItem, projectItemActive].join(" ")}>
            <span className={projectItemName}>material.frag</span>
            <span className={projectItemPath}>/project/material.frag</span>
          </div>
          <div className={projectItem}>
            <span className={projectItemName}>material.vert</span>
            <span className={projectItemPath}>/project/material.vert</span>
          </div>
          <div className={projectItem}>
            <span className={projectItemName}>captures/</span>
            <span className={projectItemPath}>/project/captures</span>
          </div>
        </div>
      </section>
      <section className={projectSection}>
        <span className={projectSectionLabel}>Project View</span>
        <div className={projectList}>
          <div className={projectItem}>
            <span className={projectItemName}>
              Placeholder for files, assets, and iteration history
            </span>
          </div>
        </div>
      </section>
    </div>
  </Panel>
);
