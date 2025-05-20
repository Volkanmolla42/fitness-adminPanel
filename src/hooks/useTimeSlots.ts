import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Json } from '@/types/supabase';

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

export function useTimeSlots() {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [workingHours, setWorkingHours] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
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

      setTimeSlots(value.slots);
      setWorkingHours(value.working_hours);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    timeSlots,
    workingHours,
    loading,
    error,
    refresh: fetchTimeSlots
  };
}
