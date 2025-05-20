import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import { useNavigate } from "react-router-dom";

export function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login"); // Kullanıcı yoksa giriş sayfasına yönlendir
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }
  return (
    <div className="relative h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main className="md:ml-20 h-screen overflow-auto py-8 px-4 md:p-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
