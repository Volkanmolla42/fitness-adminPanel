import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";

interface DashboardLayoutProps {}

export function DashboardLayout({}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 pt-14 p-4 md:p-8 overflow-auto ">
        <Outlet />
      </main>
    </div>
  );
}
