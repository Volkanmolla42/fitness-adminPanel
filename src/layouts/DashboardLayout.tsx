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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 mt-6 md:mt-0 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
