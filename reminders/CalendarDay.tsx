import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Reminder } from '../../types';

interface CalendarDayProps {
  day: Date;
  reminders: Reminder[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  day,
  reminders,
  isCurrentMonth,
  isToday,
  isExpanded,
  onClick,
}) => {
  // Sort reminders by time
  const sortedReminders = [...reminders]
    .filter(r => !r.deleted) // Filter out deleted reminders
    .sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

  return (
    <div
      onClick={onClick}
      className={`calendar-day min-h-[140px] p-3 cursor-pointer transition-all duration-300 ${
        isExpanded ? 'expanded' : ''
      } ${
        isCurrentMonth
          ? isExpanded
            ? 'bg-white'
            : isToday
              ? 'bg-blue-50 ring-1 ring-blue-200'
              : 'bg-white hover:bg-gray-50'
          : 'bg-gray-50'
      }`}
    >
      <div className={`text-sm font-medium mb-2 ${
        isToday
          ? 'text-blue-600'
          : isCurrentMonth
            ? 'text-gray-900'
            : 'text-gray-400'
      }`}>
        {format(day, 'd')}
      </div>
      <div className="space-y-1.5">
        {sortedReminders.map((reminder) => (
          <div
            key={reminder.id}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isExpanded
                ? 'bg-white shadow-md'
                : 'bg-primary-50 border border-primary-100 hover:bg-primary-100'
            }`}
          >
            {reminder.time && (
              <div className="text-xs text-primary-700 font-medium mb-1">
                {format(parseISO(`2000-01-01T${reminder.time}`), 'h:mm a')}
              </div>
            )}
            <div className={`text-sm text-primary-800 ${
              isExpanded ? 'line-clamp-none' : 'line-clamp-2'
            }`}>
              {reminder.description}
              {reminder.recurrence_type !== 'NONE' && (
                <span className="ml-2 text-xs bg-primary-50 px-2 py-0.5 rounded-full">
                  {reminder.recurrence_type === 'DAILY' && 'Daily'}
                  {reminder.recurrence_type === 'WEEKLY' && 'Weekly'}
                  {reminder.recurrence_type === 'MONTHLY' && 'Monthly'}
                </span>
              )}
            </div>
            {isExpanded && reminder.assigned_to && (
              <div className="flex items-center gap-2 mt-2">
                <img
                  src={reminder.assigned_to.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100'}
                  alt={reminder.assigned_to.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs text-primary-600 font-medium">
                  {reminder.assigned_to.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};