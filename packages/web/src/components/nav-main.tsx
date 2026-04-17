import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { SidebarSection } from "../constants/sidebar";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

export function NavMain({ sections }: { sections: SidebarSection[] }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const isRouteActive = (url: string) =>
    url === "/"
      ? location.pathname === url
      : location.pathname === url || location.pathname.startsWith(`${url}/`);

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.labelKey}>
          <SidebarGroupLabel>{t(section.labelKey)}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.url);

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    size="lg"
                    tooltip={t(item.titleKey)}
                    className="group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&_svg]:size-5"
                  >
                    <Link
                      to={item.url}
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <Icon className="size-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {t(item.titleKey)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
