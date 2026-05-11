import {
  Avatar,
  AvatarFallback,
} from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useLogoutMutation, useSessionQuery } from "@/hooks/useAuth";
import { Skeleton } from "./ui/skeleton";

export function NavUser() {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const sessionQuery = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const isLoading = sessionQuery.isLoading;
  const user = sessionQuery.data?.user;
  const initials = user?.fullname
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await navigate({ to: "/login" });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={isLoading}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-12! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:p-0!"
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {isLoading ? "..." : initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="mt-1 h-3 w-16 rounded-md" />
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium">{user?.fullname ?? "User"}</span>
                    <span className="truncate text-xs">{user?.id ?? "guest"}</span>
                  </>
                )}
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {isLoading ? "..." : initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="mt-1 h-3 w-16 rounded-md" />
                    </>
                  ) : (
                    <>
                      <span className="truncate font-medium">{user?.fullname ?? "User"}</span>
                      <span className="truncate text-xs">{user?.id ?? "guest"}</span>
                    </>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isLoading || logoutMutation.isPending}
              onClick={() => void handleLogout()}
            >
              <LogOutIcon />
              {isLoading ? "Loading..." : logoutMutation.isPending ? "Signing out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
