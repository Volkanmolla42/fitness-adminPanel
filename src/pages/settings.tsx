import React from 'react';
import { TimeSlotSettings } from '@/components/settings/TimeSlotSettings';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ayarlar</h2>
        <p className="text-muted-foreground">
          Sistem ayarlarını buradan yönetebilirsiniz.
        </p>
      </div>
      <Separator />
      <TimeSlotSettings />
    </div>
  );
}
