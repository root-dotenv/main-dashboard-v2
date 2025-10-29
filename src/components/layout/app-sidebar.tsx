// src/components/layout/app-sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";
import { navData } from "@/lib/nav-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
import { UserMenuItems } from "./user-menu-items";
import { useAuthStore } from "@/store/auth.store";

const DownloadAppDialog = () => {
  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.safaripro.hotel";
  const appStoreUrl = "https://apps.apple.com/us/app/safaripro-hotel/id123456";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={"main"}
          size="sm"
          className="w-full mt-4"
        >
          Download the App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-[#101828] dark:border-[#1D2939]">
        <DialogHeader>
          <DialogTitle className="dark:text-[#D0D5DD]">
            Download the SafariPro App
          </DialogTitle>
          <DialogDescription className="dark:text-[#98A2B3]">
            Scan a code to download the app for your guests to book hotels,
            tours, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-around items-center pt-4 pb-2">
          <div className="flex flex-col items-center gap-3">
            <div className="p-2 bg-white rounded-md">
              <QRCode value={playStoreUrl} size={128} />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Download for Android
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="p-2 bg-white rounded-md">
              <QRCode value={appStoreUrl} size={128} />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Download for iOS
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NavItem = ({
  item,
  isCollapsed,
  isOpen,
  onToggle,
}: {
  item: any;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const location = useLocation();
  const hasChildren = item.items && item.items.length > 0;

  const isLinkActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(url);
  };

  const isActive = hasChildren
    ? item.items.some((child: any) => isLinkActive(child.url))
    : isLinkActive(item.url);

  if (hasChildren) {
    return (
      <Collapsible
        className="z-40"
        open={isOpen && !isCollapsed}
        onOpenChange={onToggle}
      >
        <CollapsibleTrigger
          disabled={isCollapsed}
          className={cn(
            "flex w-full items-center rounded-lg z-40 p-2 transition-colors duration-200",
            isCollapsed ? "justify-center" : "justify-between",
            isActive
              ? "bg-[#D6EEF9] text-[#0785CF] dark:bg-[#B4E6F5] dark:text-[#0785CF] z-40"
              : "text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1C2433] dark:text-[#D0D5DD] z-40"
          )}
        >
          <div className="flex items-center gap-3 z-40">
            <item.icon
              className={cn(
                "h-5 w-5",
                isActive
                  ? "text-[#0785CF] dark:text-[#0785CF]"
                  : "text-[#344055] dark:text-[#D0D5DD]"
              )}
            />
            {!isCollapsed && (
              <span
                className={cn(
                  "text-sm font-medium",
                  !isActive && "text-[#344055] dark:text-[#D0D5DD]"
                )}
              >
                {item.title}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <>
              <ChevronDown className="h-4 w-4 data-[state=open]:hidden dark:text-[#98A2B3]" />
              <ChevronUp className="h-4 w-4 hidden data-[state=open]:block dark:text-[#98A2B3]" />
            </>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="py-1 pl-6 z-40">
          <div className="flex flex-col space-y-1 z-40">
            {item.items.map((child: any) => {
              const isChildActive = isLinkActive(child.url);
              return (
                <Link
                  key={child.title}
                  to={child.url}
                  className={cn(
                    "flex items-center gap-3 p-2 text-sm rounded-md transition-colors duration-200",
                    isChildActive
                      ? "bg-[#D6EEF9] font-medium text-[#0785CF] dark:bg-[#B4E6F5] dark:text-[#0785CF]"
                      : "text-[#667085] hover:bg-gray-100/50 hover:text-gray-800 dark:text-[#98A2B3] dark:hover:bg-[#1C2433]"
                  )}
                >
                  <child.icon
                    className={cn(
                      "h-2 w-2 border-none hover:border-none hover:bg-none",
                      isChildActive ? "fill-[#0785CF] dark:fill-[#0785CF]" : "text-[#344055]"
                    )}
                  />
                  <span>{child.title}</span>
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      to={item.url}
      className={cn(
        "flex w-full items-center rounded-lg p-2 transition-colors z-40 duration-200",
        isCollapsed ? "justify-center" : "justify-between",
        isActive
          ? "bg-[#D6EEF9] text-[#0785CF] font-semibold dark:bg-[#B4E6F5] dark:text-[#0785CF] z-40"
          : "text-gray-600 hover:bg-gray-100 dark:hover:bg-[#1C2433] dark:text-[#D0D5DD] z-40"
      )}
    >
      <div className="flex items-center gap-3 z-40">
        <item.icon
          className={cn(
            "h-5 w-5",
            isActive
              ? "text-[#1F4A8C] dark:text-[#4A9EFF]"
              : "text-[#344055] dark:text-[#D0D5DD]"
          )}
        />
        {!isCollapsed && (
          <span
            className={cn(
              "text-sm font-medium",
              !isActive && "text-[#344055] dark:text-[#D0D5DD]"
            )}
          >
            {item.title}
          </span>
        )}
      </div>
    </Link>
  );
};

export function AppSidebar() {
  const { isCollapsed } = useSidebarStore();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const findActiveParentMenu = () => {
    return navData.navMain.find((item) =>
      item.items?.some((child) => location.pathname.startsWith(child.url))
    )?.title;
  };

  const [openMenu, setOpenMenu] = React.useState<string | null>(
    findActiveParentMenu() || "Hotel Management"
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-[#FFF] border-r border-[#E4E7EC] transition-all duration-300 dark:bg-[#101828] dark:border-[#1D2939] z-40",
        isCollapsed ? "w-20" : "w-68"
      )}
    >
      <nav className="flex-1 space-y-2 p-4 pt-6 overflow-y-auto">
        <div>
          {!isCollapsed && (
            <h2 className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide dark:text-[#98A2B3]">
              Main Menu
            </h2>
          )}
          <div className="mt-2 space-y-1">
            {navData.navMain.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isCollapsed={isCollapsed}
                isOpen={openMenu === item.title}
                onToggle={() =>
                  setOpenMenu(openMenu === item.title ? null : item.title)
                }
              />
            ))}
          </div>
        </div>
        <div className="pt-4">
          {!isCollapsed && (
            <h2 className="px-2 text-[11px] font-medium text-gray-400 uppercase tracking-wide dark:text-[#98A2B3]">
              Report Overview
            </h2>
          )}
          <div className="mt-2 space-y-1">
            {navData.supportLinks.map((item) => (
              <NavItem
                key={item.title}
                item={item}
                isCollapsed={isCollapsed}
                isOpen={openMenu === item.title}
                onToggle={() =>
                  setOpenMenu(openMenu === item.title ? null : item.title)
                }
              />
            ))}
          </div>
        </div>
      </nav>

      {/* --- MODIFIED LOGIC --- */}
      {/* This block now renders as long as the sidebar is not collapsed. */}
      {!isCollapsed && (
        <div className="mt-auto">
          <div className="p-4">
            <div className="p-4 rounded-lg bg-[#F9FAFB] border-[0.9px] border-[#E4E7EC] text-center dark:bg-[#171F2F] dark:border-[#1D2939]">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#D0D5DD]">
                The All-in-One Travel App
              </h3>
              <p className="text-xs text-gray-500 mt-1 dark:text-[#98A2B3]">
                Empower your guests to book hotels, tours, and transfers
                seamlessly with the SafariPro app.
              </p>
              <DownloadAppDialog />
            </div>
          </div>

          {/* This inner block ONLY renders if a user object exists, preventing errors. */}
          {user && (
            <div className="p-4 border-t dark:border-[#1D2939]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={""} alt={user.first_name} />
                    <AvatarFallback>{user.first_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#D0D5DD]">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate dark:text-[#98A2B3]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-[#98A2B3]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    sideOffset={10}
                    className="w-56 rounded-lg ml-3 mb-2 dark:bg-[#101828] dark:border-[#1D2939]"
                  >
                    <UserMenuItems />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
