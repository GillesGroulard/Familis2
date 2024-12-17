import React from 'react';
import { Clock, Calendar, Trash2, X } from 'lucide-react';
import type { Reminder } from '../../types';
import { format, parseISO } from 'date-fns';

interface ReminderListProps {
  reminders: Reminder[];
  onDelete: (id: string) => void;
  onDeleteRecurring?: (reminder: Reminder) => void;
  onTakeCharge: (id: string) => void;
}

export const ReminderList: React.FC<ReminderListProps> = ({ 
  reminders, 
  onDelete, 
  onDeleteRecurring,
  onTakeCharge 
}) => {
  // Remove duplicates
  const uniqueReminders = reminders.reduce((acc, current) => {
    const key = `${current.description}-${current.date}-${current.time || ''}`;
    if (!acc.find(item => 
      `${item.description}-${item.date}-${item.time || ''}` === key
    )) {
      acc.push(current);
    }
    return acc;
  }, [] as Reminder[]);

  const handleDeleteClick = (reminder: Reminder) => {
    if (reminder.recurrence_type !== 'NONE' && onDeleteRecurring) {
      onDeleteRecurring(reminder);
    } else {
      onDelete(reminder.id);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {uniqueReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200 relative"
        >
          {/* Delete button for recurring reminders */}
          {reminder.recurrence_type !== 'NONE' && (
            <button
              onClick={() => handleDeleteClick(reminder)}
              className="absolute top-2 right-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete all occurrences"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 text-primary-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {format(parseISO(reminder.date), 'MMM d, yyyy')}
            </span>
            {reminder.recurrence_type !== 'NONE' && (
              <span className="text-xs bg-primary-50 px-2 py-1 rounded-full">
                {reminder.recurrence_type === 'DAILY' && 'Daily'}
                {reminder.recurrence_type === 'WEEKLY' && 'Weekly'}
                {reminder.recurrence_type === 'MONTHLY' && 'Monthly'}
              </span>
            )}
          </div>

          {reminder.time && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(`2000-01-01T${reminder.time}`), 'h:mm a')}
              </span>
            </div>
          )}

          <p className="text-gray-700 flex-grow mb-4">
            {reminder.description}
          </p>
          
          {reminder.assigned_to ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={reminder.assigned_to.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100'}
                  alt={reminder.assigned_to.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm text-gray-600">
                  {reminder.assigned_to.name} will do it
                </span>
              </div>
              {/* Delete button for individual reminders */}
              {reminder.recurrence_type === 'NONE' && (
                <button
                  onClick={() => onDelete(reminder.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onTakeCharge(reminder.id)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium"
            >
              I'll do it
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
