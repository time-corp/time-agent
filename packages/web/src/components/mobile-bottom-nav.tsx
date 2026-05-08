import { Link, useLocation } from "@tanstack/react-router";
import {
  ChatSquare,
  HamburgerMenu,
  Home,
  Server,
  Widget,
} from "@solar-icons/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";

const NAV_ITEMS = [
  { titleKey: "common.home", url: "/", Icon: Home },
  { titleKey: "common.agents", url: "/agent-configs", Icon: Widget },
  { titleKey: "common.chat", url: "/chat", Icon: ChatSquare },
  { titleKey: "common.providers", url: "/providers", Icon: Server },
] as const;

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const isActive = (url: string) =>
    url === "/"
      ? location.pathname === url
      : location.pathname === url || location.pathname.startsWith(`${url}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-sidebar md:hidden">
      {NAV_ITEMS.map(({ titleKey, url, Icon }) => {
        const active = isActive(url);
        return (
          <Link
            key={url}
            to={url}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon
              weight={active ? "Bold" : "Outline"}
              className="size-5 shrink-0"
            />
            <span>{t(titleKey)}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors active:text-foreground"
      >
        <HamburgerMenu weight="Outline" className="size-5 shrink-0" />
        <span>{t("common.more")}</span>
      </button>
    </nav>
  );
}
