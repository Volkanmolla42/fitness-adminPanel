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
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

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
    title: "Eğitmenler",
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
          "flex flex-col h-svh flex-nowrap bg-background text-foreground",
          className
        )}
      >
        {/* Logo Area */}
        <div
          className={cn("flex flex-col items-center mt-6 mb-8 shrink-0", {
            "gap-2": isCollapsed,
            "gap-4": !isCollapsed,
          })}
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
                      })}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <item.icon
                        className={cn("h-5 w-5", {
                          "mr-2": !isCollapsed,
                          "text-white": isActive,
                        })}
                      />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
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
            <ThemeToggle />
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
      </div>
    );
  }
);

SidebarContent.displayName = "SidebarContent";

const Sidebar = ({ className = "" }: SidebarProps) => {
  const { isOpen, setIsOpen, isCollapsed, toggleCollapse } = useSidebar();

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
          className="absolute -right-4 top-8 h-8 w-8 rounded-full border-2 bg-background shadow-md hover:bg-accent"
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
            className="md:hidden fixed top-4 bg-gray-200 left-4 z-[51]"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-6 w-64 z-[52]">
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
