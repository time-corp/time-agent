import { useLocation } from "@tanstack/react-router";
import * as React from "react";
import { appSidebarSections } from "../constants/sidebar";
import { NavMain } from "./nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "./ui/sidebar";

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
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            T
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">Time Agent</div>
            <div className="truncate text-xs text-sidebar-foreground/70">
              Web workspace
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavMain sections={appSidebarSections} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        TanStack + shadcn/ui
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
