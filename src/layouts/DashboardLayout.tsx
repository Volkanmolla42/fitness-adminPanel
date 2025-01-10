import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/contexts/auth-context";

interface DashboardLayoutProps {}

export function DashboardLayout({}: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
        <main className="flex-1 mt-6 md:mt-0 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
     
    </div>
  );
}
