import { useLocation } from "@tanstack/react-router";
import * as React from "react";
import { appSidebarSections } from "../constants/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";

const teams = [
  {
    name: "Time Agent V3",
    logo: <span className="text-sm font-bold">T</span>,
    plan: "Web workspace",
  },
];

function SidebarNavigationSync() {
  const location = useLocation();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const previousPathnameRef = React.useRef(location.pathname);

  React.useEffect(() => {
    if (
      isMobile &&
      openMobile &&
      previousPathnameRef.current !== location.pathname
    ) {
      setOpenMobile(false);
    }

    previousPathnameRef.current = location.pathname;
  }, [isMobile, location.pathname, openMobile, setOpenMobile]);

  return null;
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarNavigationSync />
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={appSidebarSections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
