import type { ComponentType } from "react";
import {
  ActivityIcon,
  BotMessageSquareIcon,
  HouseIcon,
  MessageSquareIcon,
  PlugZapIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

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
      { titleKey: "common.chat", url: "/chat", icon: MessageSquareIcon },
      { titleKey: "common.users", url: "/users", icon: UsersIcon },
      { titleKey: "common.providers", url: "/providers", icon: PlugZapIcon },
      { titleKey: "common.agentConfigs", url: "/agent-configs", icon: BotMessageSquareIcon },
      { titleKey: "common.builtInTools", url: "/tools", icon: WrenchIcon },
      { titleKey: "common.realtime", url: "/realtime", icon: ActivityIcon },
    ],
  },
];
