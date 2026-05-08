import * as React from "react";
import { SidebarMenuButton } from "./ui/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ReactNode;
    plan: string;
  }[];
}) {
  const activeTeam = teams[0];

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenuButton
      size="lg"
      className="hover:bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground  group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0!"
    >
      {activeTeam.logo}

      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">{activeTeam.name}</span>
        <span className="truncate text-xs">{activeTeam.plan}</span>
      </div>
    </SidebarMenuButton>
  );
}
