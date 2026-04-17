import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/app-shell";
import { appSidebarSections } from "../constants/sidebar";

function getSidebarMatch(pathname: string) {
  for (const section of appSidebarSections) {
    for (const item of section.items) {
      if (pathname === item.url || (item.url !== "/" && pathname.startsWith(`${item.url}/`))) {
        return {
          sectionKey: section.labelKey,
          titleKey: item.titleKey,
        };
      }
    }
  }

  return {
    sectionKey: "shell.workspace",
    titleKey: "common.home",
  };
}

function AppLayout() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const sidebarMatch = getSidebarMatch(pathname);

  return (
    <AppShell
      section={t(sidebarMatch.sectionKey)}
      title={t(sidebarMatch.titleKey)}
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({
  component: AppLayout,
});
