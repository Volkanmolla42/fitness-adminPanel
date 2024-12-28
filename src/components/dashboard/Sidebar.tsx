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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";


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

const Sidebar = ({ className = "" }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = React.useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r p-6 transition-all duration-300",
        { "w-64": isOpen, "w-16": !isOpen },
        className
      )}
    >
      <button onClick={toggleSidebar} className="md:hidden mb-4">
        {isOpen ? "Hide" : "Show"} Sidebar
      </button>
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
          <Link key={item.path} to={item.path}>
            <Button
              variant={currentPath === item.path ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.title}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 space-y-2">
        <Separator className="mb-4" />
        <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-5 w-5" />
          Ayarlar 
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive"
          onClick={() => navigate('/')} 
        >
          <LogOut className="mr-2 h-5 w-5" />
          Çıkış
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
