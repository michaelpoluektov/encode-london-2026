import type { JSX } from "react";
import { Panel } from "./Panel";
import {
  projectList,
  projectSection,
  projectSidebar,
} from "./project-sidebar.css";
import { NavItem } from "./ui/NavItem";
import { Stack } from "./ui/Stack";
import { Text } from "./ui/Text";

export const ProjectSidebar = (): JSX.Element => (
  <Panel title="Project">
    <Stack className={projectSidebar} gap={4}>
      <section className={projectSection}>
        <Text as="span" variant="label">
          Workspace
        </Text>
        <div className={projectList}>
          <NavItem
            active
            subtitle="/project/material.frag"
            title="material.frag"
          />
          <NavItem subtitle="/project/material.vert" title="material.vert" />
          <NavItem subtitle="/project/captures" title="captures/" />
        </div>
      </section>
      <section className={projectSection}>
        <Text as="span" variant="label">
          Project View
        </Text>
        <div className={projectList}>
          <NavItem title="Placeholder for files, assets, and iteration history" />
        </div>
      </section>
    </Stack>
  </Panel>
);
