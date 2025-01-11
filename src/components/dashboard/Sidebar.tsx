import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  BarChart3,
  Settings,
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

const SidebarContent = ({
  className = "",
  onNavigate,
  isCollapsed = false,
}: SidebarContentProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className={cn("flex flex-col h-full bg-background text-foreground overflow-hidden", className)}>
      {/* Logo Area */}
      <div className={cn("flex flex-col items-center mt-6 mb-8 shrink-0 transition-all duration-300 ease-in-out", {
        "gap-2": isCollapsed,
        "gap-4": !isCollapsed
      })}>
        <div className="size-12 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out">
          <img src="/lotus.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className={cn("transition-all duration-300 ease-in-out", {
          "opacity-0 scale-95": isCollapsed,
          "opacity-100 scale-100": !isCollapsed
        })}>
          {!isCollapsed && <span className="font-semibold text-xl text-foreground">LOCA FIT STUDIO</span>}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1 flex-grow px-2">
        <TooltipProvider delayDuration={0}>
          {navigationItems.map((item) => (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Button
                  variant={currentPath === item.path ? "default" : "ghost"}
                  className={cn("w-full transition-all duration-300 ease-in-out", {
                    "justify-start": !isCollapsed,
                    "justify-center p-2": isCollapsed,
                    "bg-primary/10": currentPath === item.path && isCollapsed
                  })}
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className={cn("h-5 w-5 transition-all duration-300 ease-in-out", {
                    "mr-2": !isCollapsed,
                    "text-white": currentPath === item.path && !isCollapsed,
                    "text-primary": currentPath === item.path && isCollapsed
                  })} />
                  <span className={cn("transition-all duration-300 ease-in-out", {
                    "opacity-0 scale-95 w-0": isCollapsed,
                    "opacity-100 scale-100": !isCollapsed
                  })}>
                    {!isCollapsed && item.title}
                  </span>
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium z-[999]">
                  {item.title}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      {/* Bottom Section with Theme Toggle and Logout */}
      <div className="mt-auto p-2 space-y-3">
        <Separator />
        <div className={cn("flex items-center", {
          "justify-between px-2": !isCollapsed,
          "flex-col gap-3 justify-center": isCollapsed
        })}>
          <ThemeToggle />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut} 
                  className={cn("text-red-600 hover:text-red-700 hover:bg-red-100", {
                    "w-full justify-start": !isCollapsed,
                    "p-2 justify-center": isCollapsed
                  })}
                >
                  <LogOut className={cn("h-5 w-5", {
                    "mr-2": !isCollapsed
                  })} />
                  {!isCollapsed && "Çıkış Yap"}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-medium z-[999]">
                  Çıkış Yap
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ className = "" }: SidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden sticky top-0 md:flex h-svh border-r z-50 transition-[width] duration-300 ease-in-out", 
          {
            "w-64": !isCollapsed,
            "w-20": isCollapsed,
          },
          className
        )}
      >
        <div className="w-full relative">
          <div className={cn(
            "absolute inset-0 transition-all duration-300 ease-in-out",
            {
              "translate-x-0 opacity-100": !isCollapsed,
              "-translate-x-full opacity-0": isCollapsed,
            }
          )}>
            <SidebarContent isCollapsed={false} />
          </div>
          
          <div className={cn(
            "absolute inset-0 transition-all duration-300 ease-in-out",
            {
              "translate-x-0 opacity-100": isCollapsed,
              "translate-x-full opacity-0": !isCollapsed,
            }
          )}>
            <SidebarContent isCollapsed={true} />
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-4 top-8 h-8 w-8 rounded-full border-2 bg-background shadow-md hover:bg-accent z-[51] transition-transform duration-300 ease-in-out"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 transition-transform duration-300 ease-in-out" />
          ) : (
            <ChevronLeft className="h-4 w-4 transition-transform duration-300 ease-in-out" />
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
