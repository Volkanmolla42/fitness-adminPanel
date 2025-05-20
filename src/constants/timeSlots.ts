 
 import { useTimeSlots } from '@/hooks/useTimeSlots';

export function useAvailableTimeSlots() {
  const { timeSlots, workingHours, loading, error } = useTimeSlots();
  return { TIME_SLOTS: timeSlots, WORKING_HOURS: workingHours, loading, error };
}

// Fallback defaults in case database is not available
const DEFAULT_TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "14:00",
  "15:30",
  "17:00",
  "18:00",
  "19:00"
];

export const DEFAULT_WORKING_HOURS = {
  start: "10:00",
  end: "20:00",
};

export default DEFAULT_TIME_SLOTS;
 