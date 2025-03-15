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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            "flex flex-col min-h-24 items-center mt-6 mb-6 shrink-0",
            {
              "gap-2": isCollapsed,
              "gap-4": !isCollapsed,
            }
          )}
        >
          <div className="size-12 rounded-lg flex items-center justify-center">
            <img
              src="/lotus.png"
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className={cn({
              hidden: isCollapsed,
              block: !isCollapsed,
            })}
          >
            <span className="font-semibold text-xl truncate text-foreground">
              LOCA FIT STUDIO
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 flex-grow px-2">
          <TooltipProvider delayDuration={0}>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn("w-full", {
                        "justify-start px-3": !isCollapsed,
                        "justify-center p-2": isCollapsed,
                        "dark:bg-gray-800 dark:text-white": isActive,
                        "dark:text-gray-300 dark:hover:bg-gray-800": !isActive,
                      })}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon
                        className={cn("h-5 w-5", {
                          "mr-2": !isCollapsed,
                          "text-white": isActive,
                          "dark:text-white": isActive,
                          "dark:text-gray-300": !isActive,
                        })}
                      />
                      {!isCollapsed && <span className="dark:text-inherit">{item.title}</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium dark:bg-gray-800 dark:text-gray-300">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto p-2 space-y-3">
          <Separator />
          <div
            className={cn("flex items-center", {
              "justify-between px-2": !isCollapsed,
              "flex-col gap-3 justify-center": isCollapsed,
            })}
          >
            {/* Tema değiştirme düğmesi */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className={cn({
                      "w-full justify-start": !isCollapsed,
                      "p-2 justify-center": isCollapsed,
                    })}
                  >
                    {theme === "light" ? (
                      <Moon className={cn("h-5 w-5", { "mr-2": !isCollapsed })} />
                    ) : (
                      <Sun className={cn("h-5 w-5", { "mr-2": !isCollapsed })} />
                    )}
                    {!isCollapsed && (theme === "light" ? "Karanlık Mod" : "Aydınlık Mod")}
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
                      "text-red-600 hover:text-red-700 hover:bg-red-100",
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
                  <TooltipContent side="right" className="font-medium">
                    Çıkış Yap
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {/* Footer */}
        <footer className="border-t py-3 px-4 text-sm text-muted-foreground">
          <div className={cn("flex flex-col md:flex-row", {
            "hidden":isCollapsed,
            "items-center justify-center": !isCollapsed,
          })}>
            {/* Destek bilgisi ve iletişim */}
            <div className={cn("flex flex-col items-center mb-2 md:mb-0", {
              "md:items-start md:mr-auto": !isCollapsed,
            })}>
              <p className="font-medium mb-1">Destek: Volkan Molla</p>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="text-muted-foreground hover:text-primary p-0 h-auto"
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
                  <TooltipContent side="top" className="font-medium">
                    WhatsApp ile iletişime geç
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Bug Report butonu */}
            <div className={cn({
              "md:ml-auto": !isCollapsed,
              "hidden": isCollapsed,
            })}>
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <BugReportModal />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top"  className="font-medium">
                    Hata bildir
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </footer>
      </div>
    );
  }
);

SidebarContent.displayName = "SidebarContent";

const Sidebar = ({ className = "" }: SidebarProps) => {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();
  const { theme } = useTheme();

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden sticky top-0 md:flex h-svh border-r z-50",
          {
            "w-64": !isCollapsed,
            "w-20": isCollapsed,
          },
          theme === 'dark' ? 'bg-background' : 'bg-pink-100/80',
          theme === 'dark' ? 'border-border' : 'border-pink-100',
          className
        )}
      >
        <div className="w-full relative overflow-hidden">
          <div className="w-full">
            <SidebarContent isCollapsed={isCollapsed} />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute -right-4 top-8 h-8 w-8 rounded-full border-2 shadow-md",
            theme === 'dark' 
              ? 'bg-background hover:bg-accent border-border' 
              : 'bg-pink-50 hover:bg-pink-100 border-pink-100 text-pink-700'
          )}
          onClick={toggleCollapse}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
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
              "md:hidden fixed top-4 left-4 z-[51]",
              theme === 'dark' 
                ? 'text-foreground hover:bg-accent' 
                : 'text-pink-700 hover:bg-pink-100/50'
            )}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className={cn(
            "py-0 px-2 w-64 z-[52]",
            theme === 'dark' 
              ? 'bg-background border-border' 
              : 'bg-pink-100 border-pink-100'
          )}
        >
          <SheetTitle className="hidden">FitAdmin Menu</SheetTitle>
          <SheetDescription className="hidden">
            Gezinmek için menüyü kullanın
          </SheetDescription>
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
