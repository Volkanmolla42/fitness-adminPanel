import React, { useState, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  BarChart3,
  LogOut,
  LayoutDashboard,
  UserCog,
  Menu,
  Package,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import { BugReportModal } from "@/components/BugReportModal";
import { useTheme } from "@/contexts/theme-context";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: "Ana Sayfa",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "Üyeler",
    icon: Users,
    path: "/members",
  },
  {
    title: "Randevular",
    icon: Calendar,
    path: "/appointments",
  },
  {
    title: "Paketler",
    icon: Package,
    path: "/services",
  },
  {
    title: "Antrenörler",
    icon: UserCog,
    path: "/trainers",
  },
  {
    title: "Mesajlar",
    icon: MessageSquare,
    path: "/messages",
  },
  {
    title: "Raporlar",
    icon: BarChart3,
    path: "/reports",
  },
];

interface SidebarContentProps {
  className?: string;
  onNavigate?: () => void;
  isCollapsed?: boolean;
}

// Hooks
const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return {
    isOpen,
    setIsOpen,
    isCollapsed,
    toggleCollapse,
  };
};

// Components
const SidebarContent = memo(
  ({
    className = "",
    onNavigate,
    isCollapsed = false,
  }: SidebarContentProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleNavigation = useCallback(
      (path: string) => {
        navigate(path);
        onNavigate?.();
      },
      [navigate, onNavigate]
    );

    return (
      <div
        className={cn(
          "flex flex-col h-svh flex-nowrap text-foreground",
          className
        )}
      >
        {/* Logo Area */}
        <div
          className={cn(
            "relative flex h-44 justify-center flex-col items-center shrink-0 overflow-hidden",
            theme === "dark"
              ? "bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800"
              : "bg-gradient-to-b from-pink-200 to-pink-300 border-b border-pink-300",
            isCollapsed ? "py-6" : "py-8"
          )}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-pink-400 -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-purple-400 translate-x-1/2 translate-y-1/2 blur-xl"></div>
          </div>

          <a
            href="https://locafit-website.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative size-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-gray-800 dark:to-gray-900",
              "shadow-md hover:shadow-lg hover:scale-105 border border-pink-200/50 dark:border-gray-700/50",
              "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-pink-300 before:to-purple-400 before:opacity-0 hover:before:opacity-20"
            )}
          >
            <img
              src="/lotus.png"
              alt="Loca Fit Studio"
              className="relative z-10 w-10 h-10 object-contain"
            />
          </a>

          <div
            className={cn("mt-3", {
              "opacity-0 h-0 transform -translate-y-2": isCollapsed,
              "opacity-100 h-auto transform translate-y-0": !isCollapsed,
            })}
          >
            <div className="flex flex-col items-center justify-center">
              <a
                href="https://locafit-website.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl font-bold tracking-tight text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
              >
                LOCA FIT STUDIO
              </a>
              <span className="font-medium text-xs tracking-wide text-pink-500/70 dark:text-pink-400/70 mt-1">
                Admin Paneli
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="space-y-1">
            <TooltipProvider delayDuration={0}>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full relative group mb-1",
                          {
                            "justify-start h-10 px-3": !isCollapsed,
                            "justify-center h-10 p-2": isCollapsed,
                          },
                          isActive
                            ? cn(
                                "bg-pink-100/80 text-pink-700 hover:bg-pink-200/80 dark:bg-gray-800/80 dark:text-pink-400 dark:hover:bg-gray-800",
                                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-gradient-to-b before:from-pink-400 before:to-purple-500 before:rounded-r-full"
                              )
                            : "text-gray-700 hover:bg-pink-50 dark:text-gray-300 dark:hover:bg-gray-800/50"
                        )}
                        onClick={() => handleNavigation(item.path)}
                      >
                        <item.icon
                          className={cn("h-5 w-5 group-hover:scale-110", {
                            "mr-3": !isCollapsed,
                            "text-pink-600 dark:text-pink-400": isActive,
                            "text-gray-500 dark:text-gray-400": !isActive,
                          })}
                        />
                        {!isCollapsed && (
                          <span
                            className={cn(
                              "font-medium tracking-wide",
                              isActive
                                ? "text-pink-700 dark:text-pink-400"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {item.title}
                          </span>
                        )}

                        {isActive && !isCollapsed && (
                          <span className="absolute right-3 h-2 w-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-500"></span>
                        )}
                      </Button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent
                        side="right"
                        className={cn(
                          "font-medium",
                          isActive
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none"
                            : "bg-white dark:bg-gray-800 dark:text-gray-300 text-black"
                        )}
                      >
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto space-y-3">
          <div
            className={cn(
              "px-3 py-2",
              theme === "dark" ? "bg-gray-900/50" : "bg-pink-100/50"
            )}
          >
            <div
              className={cn("flex items-center", {
                "justify-between": !isCollapsed,
                "flex-col gap-3 justify-center": isCollapsed,
              })}
            >
              {/* Theme toggle button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTheme}
                      className={cn(
                        "",
                        theme === "dark"
                          ? "text-gray-300 hover:text-white hover:bg-gray-800"
                          : "text-gray-700 hover:text-pink-700 hover:bg-pink-100/80",
                        {
                          "w-full justify-start": !isCollapsed,
                          "p-2 justify-center": isCollapsed,
                        }
                      )}
                    >
                      {theme === "light" ? (
                        <Moon
                          className={cn("h-5 w-5", { "mr-2": !isCollapsed })}
                        />
                      ) : (
                        <Sun
                          className={cn("h-5 w-5", { "mr-2": !isCollapsed })}
                        />
                      )}
                      {!isCollapsed &&
                        (theme === "light" ? "Karanlık Mod" : "Aydınlık Mod")}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {theme === "light" ? "Karanlık Mod" : "Aydınlık Mod"}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={signOut}
                      className={cn(
                        "text-red-600 hover:text-red-700 hover:bg-red-100/50",
                        {
                          "w-full justify-start": !isCollapsed,
                          "p-2 justify-center": isCollapsed,
                        }
                      )}
                    >
                      <LogOut
                        className={cn("h-5 w-5", {
                          "mr-2": !isCollapsed,
                        })}
                      />
                      {!isCollapsed && "Çıkış Yap"}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent
                      side="right"
                      className="font-medium bg-red-500 text-white border-none"
                    >
                      Çıkış Yap
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Footer */}
          <footer
            className={cn(
              "py-3 px-4 text-sm",
              theme === "dark"
                ? "border-t border-gray-800 text-gray-400"
                : "border-t border-pink-200 text-gray-600"
            )}
          >
            <div
              className={cn("flex flex-col", {
                hidden: isCollapsed,
                "items-center": !isCollapsed,
              })}
            >
              {/* Support info and contact */}
              <div className="flex flex-col items-center mb-2">
                <p className="font-medium mb-1 text-xs">Destek: Volkan Molla</p>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className={cn(
                          "p-0 h-auto text-xs",
                          theme === "dark"
                            ? "text-pink-400 hover:text-pink-300"
                            : "text-pink-600 hover:text-pink-700"
                        )}
                      >
                        <a
                          href="https://api.whatsapp.com/send?phone=905418224484"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="WhatsApp üzerinden iletişim"
                        >
                          +90 (541) 822 44 84
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="font-medium bg-green-500 text-white border-none"
                    >
                      WhatsApp ile iletişime geç
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Bug Report button */}
              <div className="mt-2">
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center">
                        <BugReportModal />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="font-medium bg-orange-500 text-white border-none"
                    >
                      Hata bildir
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }
);

SidebarContent.displayName = "SidebarContent";

const Sidebar = ({ className = "" }: SidebarProps) => {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();
  const { theme } = useTheme();

  // Function to handle navigation in desktop sidebar
  const handleDesktopNavigation = useCallback(() => {
    // Only collapse the sidebar if it's currently expanded
    if (!isCollapsed) {
      toggleCollapse();
    }
  }, [isCollapsed, toggleCollapse]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden absolute top-0 left-0 md:flex h-svh z-50",
          {
            "w-64": !isCollapsed,
            "w-20": isCollapsed,
          },
          theme === "dark"
            ? "bg-gray-950 border-r border-gray-800"
            : "bg-white border-r border-pink-200 shadow-sm",
          className
        )}
      >
        <div className="w-full relative overflow-hidden">
          <div className="w-full">
            <SidebarContent
              isCollapsed={isCollapsed}
              onNavigate={handleDesktopNavigation}
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute -right-4 top-44 -translate-y-1/2  h-8 w-8 rounded-full border shadow-md",
            theme === "dark"
              ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
              : "bg-white hover:bg-pink-50 border-pink-200 text-pink-600 hover:text-pink-700"
          )}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 hover:scale-110" />
          ) : (
            <ChevronLeft className="h-4 w-4 hover:scale-110" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden fixed top-4 left-4 z-[51] rounded-full shadow-md",
              theme === "dark"
                ? "bg-gray-900/80 text-white hover:bg-gray-800"
                : "bg-white/80 text-pink-600 hover:bg-pink-50 border border-pink-100"
            )}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn(
            "py-0 px-0 w-64 z-[52] overflow-hidden",
            theme === "dark"
              ? "bg-gray-950 border-r border-gray-800"
              : "bg-white border-r border-pink-200"
          )}
        >
          <SheetTitle className="sr-only">FitAdmin Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Gezinmek için menüyü kullanın
          </SheetDescription>
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
