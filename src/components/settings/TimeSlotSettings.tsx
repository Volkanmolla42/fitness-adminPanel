import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Json } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TimeSlotSettings {
  slots: string[];
  working_hours: {
    start: string;
    end: string;
  };
}

function isTimeSlotSettings(value: unknown): value is TimeSlotSettings {
  if (typeof value !== 'object' || value === null) return false;
  
  const settings = value as any;
  return (
    Array.isArray(settings.slots) &&
    settings.slots.every((slot: unknown) => typeof slot === 'string') &&
    typeof settings.working_hours === 'object' &&
    settings.working_hours !== null &&
    typeof settings.working_hours.start === 'string' &&
    typeof settings.working_hours.end === 'string'
  );
}

export function TimeSlotSettings() {
  const [settings, setSettings] = useState<TimeSlotSettings>({
    slots: [],
    working_hours: { start: '', end: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'time_slots')
        .single();

      if (error) throw error;
      
      const value = data.value as unknown;
      if (!isTimeSlotSettings(value)) {
        throw new Error('Invalid settings format');
      }
      setSettings(value);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {      const { error } = await supabase
        .from('settings')
        .update({ value: settings as unknown as Json })
        .eq('key', 'time_slots');

      if (error) throw error;
      
      toast.success('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    if (!newSlot) return;
    
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(newSlot)) {
      toast.error('Geçersiz saat formatı. Lütfen HH:mm formatında girin');
      return;
    }

    // Check if slot already exists
    if (settings.slots.includes(newSlot)) {
      toast.error('Bu saat zaten eklenmiş');
      return;
    }

    // Add new slot and sort
    const newSlots = [...settings.slots, newSlot].sort((a, b) => {
      const timeA = new Date('1970/01/01 ' + a);
      const timeB = new Date('1970/01/01 ' + b);
      return timeA.getTime() - timeB.getTime();
    });

    setSettings({ ...settings, slots: newSlots });
    setNewSlot('');
  };

  const removeTimeSlot = (slot: string) => {
    setSettings({
      ...settings,
      slots: settings.slots.filter(s => s !== slot)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Randevu Saatleri</CardTitle>
        <CardDescription>
          Randevu alınabilecek saatleri ve çalışma saatlerini yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingStart">Açılış Saati</Label>
              <Input
                id="workingStart"
                type="time"
                value={settings.working_hours.start}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    working_hours: { ...settings.working_hours, start: e.target.value }
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingEnd">Kapanış Saati</Label>
              <Input
                id="workingEnd"
                type="time"
                value={settings.working_hours.end}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    working_hours: { ...settings.working_hours, end: e.target.value }
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Randevu Saatleri</Label>
          <div className="flex gap-2">
            <Input
              type="time"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              placeholder="HH:mm"
            />
            <Button onClick={addTimeSlot}>
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {settings.slots.map((slot) => (
              <div
                key={slot}
                className="flex items-center justify-between p-2 rounded-md border bg-card"
              >
                <span>{slot}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeSlot(slot)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="w-full"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ayarları Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
