import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import  Dashboard  from "@/pages/dashboard";
import  Members  from "@/pages/members";
import  Trainers  from "@/pages/trainers";
import  Appointments  from "@/pages/appointments";
import Services from "@/pages/services";
import Reports from "@/pages/reports";
import SettingsPage from "@/pages/settings";

function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Yükleniyor...</div>}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/services" element={<Services />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
