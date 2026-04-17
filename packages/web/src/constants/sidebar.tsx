import type { ComponentType } from "react";
import { ActivityIcon, HouseIcon, UsersIcon } from "lucide-react";

export type SidebarItem = {
  titleKey: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarSection = {
  labelKey: string;
  items: SidebarItem[];
};

export const appSidebarSections: SidebarSection[] = [
  {
    labelKey: "sidebar.workspace",
    items: [
      { titleKey: "common.home", url: "/", icon: HouseIcon },
      { titleKey: "common.users", url: "/users", icon: UsersIcon },
      { titleKey: "common.realtime", url: "/realtime", icon: ActivityIcon },
    ],
  },
];
