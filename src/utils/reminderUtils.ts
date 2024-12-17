import { 
  isSameMonth, 
  parseISO, 
  getDay,
  getDate,
  isSameDay
} from 'date-fns';
import type { Reminder } from '../types';

export const getRemindersForDate = (
  reminders: Reminder[],
  date: Date,
  currentMonth: Date
): Reminder[] => {
  // Filter out any undefined or null reminders
  const validReminders = reminders.filter(r => r && r.date);

  return validReminders.filter(reminder => {
    const reminderDate = parseISO(reminder.date);

    // Handle different recurrence types
    switch (reminder.recurrence_type) {
      case 'DAILY':
        // Show daily reminders if they start on or before this date
        // and are within the current month
        return reminderDate <= date && 
               isSameMonth(date, currentMonth);

      case 'WEEKLY':
        // Show weekly reminders on the same day of week if they start on or before this date
        // and are within the current month
        return reminderDate <= date && 
               getDay(reminderDate) === getDay(date) &&
               isSameMonth(date, currentMonth);

      case 'MONTHLY':
        // Show monthly reminders on the same day of month if they start on or before this date
        return reminder.recurrence_day === getDate(date) &&
               reminderDate <= date &&
               isSameMonth(date, currentMonth);

      case 'NONE':
      default:
        // Show one-time reminders only on their specific date
        return isSameDay(reminderDate, date);
    }
  });
};

export const filterRemindersByAudience = (
  reminders: Reminder[],
  audience: 'ELDER' | 'FAMILY'
): Reminder[] => {
  return reminders.filter(reminder => reminder.target_audience === audience);
};

export const sortRemindersByTime = (reminders: Reminder[]): Reminder[] => {
  return [...reminders].sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
};

export const removeDuplicateReminders = (reminders: Reminder[]): Reminder[] => {
  const seen = new Set();
  return reminders.filter(reminder => {
    const key = `${reminder.description}-${reminder.date}-${reminder.time || ''}-${reminder.recurrence_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
