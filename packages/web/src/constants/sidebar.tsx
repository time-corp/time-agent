import type { Icon, IconWeight } from "@solar-icons/react/lib/types";
import type { ComponentType } from "react";
import {
  ChatSquare,
  ChatSquareCode,
  CodeSquare,
  DocumentText,
  Home,
  Route,
  Server,
  SettingsMinimalistic,
  UsersGroupRounded,
  UsersGroupTwoRounded,
  Widget,
} from "@solar-icons/react";

export type SidebarItem = {
  titleKey: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarSection = {
  labelKey: string;
  items: SidebarItem[];
};

const DEFAULT_WEIGHT: IconWeight = "Outline";

function makeIcon(
  SolarIcon: Icon,
  weight: IconWeight = DEFAULT_WEIGHT,
): ComponentType<{ className?: string }> {
  return function SolarIconWrapper({ className }: { className?: string }) {
    return <SolarIcon {...(className ? { className } : {})} weight={weight} />;
  };
}

export const appSidebarSections: SidebarSection[] = [
  {
    labelKey: "sidebar.overview",
    items: [
      { titleKey: "common.home", url: "/", icon: makeIcon(Home) },
      { titleKey: "common.chat", url: "/chat", icon: makeIcon(ChatSquare) },
    ],
  },
  {
    labelKey: "sidebar.workspace",
    items: [
      {
        titleKey: "common.users",
        url: "/users",
        icon: makeIcon(UsersGroupRounded),
      },
      {
        titleKey: "common.providers",
        url: "/providers",
        icon: makeIcon(Server),
      },
      {
        titleKey: "common.channels",
        url: "/channels",
        icon: makeIcon(Route),
      },
    ],
  },
  {
    labelKey: "sidebar.agents",
    items: [
      {
        titleKey: "common.agentConfigs",
        url: "/agent-configs",
        icon: makeIcon(Widget),
      },
      {
        titleKey: "common.agentTeams",
        url: "/agent-teams",
        icon: makeIcon(UsersGroupTwoRounded),
      },
    ],
  },
  {
    labelKey: "sidebar.system",
    items: [
      {
        titleKey: "common.builtInTools",
        url: "/tools",
        icon: makeIcon(ChatSquareCode),
      },
      { titleKey: "common.logs", url: "/logs", icon: makeIcon(DocumentText) },
      {
        titleKey: "common.terminal",
        url: "/terminal",
        icon: makeIcon(CodeSquare),
      },
      {
        titleKey: "common.settings",
        url: "/settings",
        icon: makeIcon(SettingsMinimalistic),
      },
    ],
  },
];
