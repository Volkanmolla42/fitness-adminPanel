import React from "react";
import AppointmentsWidget from "@/components/dashboard/AppointmentsWidget";

const AppointmentsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Randevular</h1>
        <p className="text-muted-foreground mt-2">
          Tüm randevuları görüntüle ve yönet
        </p>
      </div>

      <AppointmentsWidget />
    </div>
  );
};

export default AppointmentsPage;
