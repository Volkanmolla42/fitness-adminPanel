import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardPage from "@/pages/dashboard";
import MembersPage from "@/pages/members";
import ServicesPage from "@/pages/services";
import TrainersPage from "@/pages/trainers";
import AppointmentsPage from "@/pages/appointments";
import ReportsPage from "@/pages/reports";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="trainers" element={<TrainersPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
