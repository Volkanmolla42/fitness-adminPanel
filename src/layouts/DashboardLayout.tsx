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
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b px-4 flex items-center">
          <div>
            <span className="text-sm text-muted-foreground">Hoş geldiniz,</span>
            <span className="ml-1 font-medium">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
