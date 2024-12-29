import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Dumbbell,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  LayoutDashboard,
  UserCog,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
    title: "Hizmetler",
    icon: Dumbbell,
    path: "/services",
  },
  {
    title: "Eğitmenler",
    icon: UserCog,
    path: "/trainers",
  },
  {
    title: "Randevular",
    icon: Calendar,
    path: "/appointments",
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

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Logo Area */}
      <div className="flex items-center gap-2 mb-8 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-xl">FitAdmin</span>
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
            <item.icon className="mr-2 h-5 w-5" />
            {item.title}
          </Button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 space-y-2">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleNavigation("/settings")}
        >
          <Settings className="mr-2 h-5 w-5" />
          Ayarlar
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={() => handleNavigation("/")}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Çıkış
        </Button>
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
        className={cn("hidden md:flex h-screen w-64 border-r p-6", className)}
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
