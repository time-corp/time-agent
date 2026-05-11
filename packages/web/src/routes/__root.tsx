import {
  Navigate,
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/app-shell";
import { PageLoading } from "../components/page-loading";
import { ThemeToggle } from "../components/theme-toggle";
import { appSidebarSections } from "../constants/sidebar";
import { useSessionQuery } from "../hooks/useAuth";

function getSidebarMatch(pathname: string) {
  for (const section of appSidebarSections) {
    for (const item of section.items) {
      if (
        pathname === item.url ||
        (item.url !== "/" && pathname.startsWith(`${item.url}/`))
      ) {
        return {
          sectionKey: section.labelKey,
          titleKey: item.titleKey,
        };
      }
    }
  }

  return {
    sectionKey: "sidebar.overview",
    titleKey: "common.home",
  };
}

function AppLayout() {
  const { t } = useTranslation();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const sessionQuery = useSessionQuery();
  const sidebarMatch = getSidebarMatch(pathname);
  const isLoginRoute = pathname === "/login";
  const [hasResolvedInitialSession, setHasResolvedInitialSession] = useState(
    () => sessionQuery.isFetched || sessionQuery.isError,
  );

  useEffect(() => {
    if (hasResolvedInitialSession) return;
    if (sessionQuery.isFetched || sessionQuery.isError) {
      setHasResolvedInitialSession(true);
    }
  }, [
    hasResolvedInitialSession,
    sessionQuery.isError,
    sessionQuery.isFetched,
  ]);

  const shouldShowPageLoading =
    !hasResolvedInitialSession &&
    (sessionQuery.isPending || sessionQuery.fetchStatus === "fetching");

  if (shouldShowPageLoading) {
    return <PageLoading />;
  }

  if (!sessionQuery.data?.authenticated && !isLoginRoute) {
    return <Navigate to="/login" />;
  }

  if (sessionQuery.data?.authenticated && isLoginRoute) {
    return <Navigate to="/" />;
  }

  if (isLoginRoute) {
    return <Outlet />;
  }

  return (
    <AppShell
      section={t(sidebarMatch.sectionKey)}
      title={t(sidebarMatch.titleKey)}
      actions={<ThemeToggle />}
    >
      <Outlet />
    </AppShell>
  );
}

export const Route = createRootRoute({
  component: AppLayout,
});
