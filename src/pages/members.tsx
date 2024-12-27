import React from "react";
import { Card } from "@/components/ui/card";

const MembersPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Üyeler</h1>
        <p className="text-muted-foreground mt-2">
          Tüm üyeleri görüntüle ve yönet
        </p>
      </div>

      <Card className="p-6">
        <p>Üye listesi burada görüntülenecek</p>
      </Card>
    </div>
  );
};

export default MembersPage;
