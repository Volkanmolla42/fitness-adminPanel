import React from "react";
import { Card } from "@/components/ui/card";
import RevenueChart from "@/components/dashboard/RevenueChart";

const ReportsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground mt-2">
          Performans ve gelir raporlarını görüntüle
        </p>
      </div>

      <RevenueChart />
    </div>
  );
};

export default ReportsPage;
