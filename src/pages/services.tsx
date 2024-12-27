import React from "react";
import { Card } from "@/components/ui/card";

const ServicesPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hizmetler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu hizmetlerini yönet
        </p>
      </div>

      <Card className="p-6">
        <p>Hizmet listesi burada görüntülenecek</p>
      </Card>
    </div>
  );
};

export default ServicesPage;
