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
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: "Ana Sayfa",
    icon: LayoutDashboard,
    path: "/",
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
}

const SidebarContent = ({
  className = "",
  onNavigate,
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
    <div className={cn("flex flex-col h-full bg-background text-foreground", className)}>
      {/* Logo Area */}
      <div className="flex flex-col items-center gap-4 my-2 shrink-0">
        <div className="size-1/4 rounded-lg flex items-center justify-center">
          <img src="/lotus.png" alt="" />
        </div>
        <span className="font-semibold text-xl text-foreground">LOCA FIT STUDIO</span>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2 flex-grow overflow-y-auto">
        {navigationItems.map((item) => (
          <Button
            key={item.path}
            variant={currentPath === item.path ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleNavigation(item.path)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        ))}
      </nav>

      {/* Bottom Section with Theme Toggle and Logout */}
      <div className="mt-auto p-4 space-y-4">
        <Separator />
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ className = "" }: SidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn("hidden sticky top-0 md:flex h-screen w-64 border-r p-6", className)}
      >
        <SidebarContent className="w-full" />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-6 w-64">
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
