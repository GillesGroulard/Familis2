import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, addDays, isSameDay, isWithinInterval, getDate, parseISO } from 'date-fns';
import type { Reminder } from '../types';
import { fr } from 'date-fns/locale';  // Importation de la locale française

interface AgendaSlideProps {
  reminders: Reminder[];
}

export const AgendaSlide: React.FC<AgendaSlideProps> = ({ reminders }) => {
  const [now, setNow] = useState(new Date());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper function to check if a reminder should be shown on a specific date
  const shouldShowReminderOnDate = (reminder: Reminder, targetDate: Date): boolean => {
    const reminderDate = parseISO(reminder.date);

    switch (reminder.recurrence_type) {
      case 'NONE':
        return isSameDay(reminderDate, targetDate);
      
      case 'DAILY':
        return isWithinInterval(targetDate, {
          start: reminderDate,
          end: weekEnd
        });
      
      case 'WEEKLY':
        return reminderDate <= targetDate && 
               reminderDate.getDay() === targetDate.getDay() &&
               targetDate <= weekEnd;
      
      case 'MONTHLY':
        return reminder.recurrence_day === getDate(targetDate) &&
               reminderDate <= targetDate &&
               targetDate <= weekEnd;
      
      default:
        return false;
    }
  };

  // Filter reminders for specific dates
  const filterRemindersForDate = (date: Date) => {
    return reminders
      .filter(reminder => 
        reminder.target_audience === 'ELDER' && 
        shouldShowReminderOnDate(reminder, date)
      )
      .sort((a, b) => {
        // Sort by time if available, otherwise by creation date
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  };

  const todayReminders = filterRemindersForDate(now);
  const tomorrowReminders = filterRemindersForDate(addDays(now, 1));
  
  // Get other reminders for the week
  const otherReminders = reminders.filter(reminder => {
    if (reminder.target_audience !== 'ELDER') return false;
    
    const reminderDate = parseISO(reminder.date);
    const isNotTodayOrTomorrow = !isToday(reminderDate) && !isTomorrow(reminderDate);
    
    // Check future dates in the week
    for (let i = 2; i <= 6; i++) {
      const futureDate = addDays(now, i);
      if (shouldShowReminderOnDate(reminder, futureDate)) {
        return true;
      }
    }
    
    return false;
  });

  const ReminderCard = ({ reminder, highlightLevel = 'normal' }: { reminder: Reminder, highlightLevel?: 'high' | 'medium' | 'normal' }) => {
    const bgColors = {
      high: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      medium: 'bg-blue-50/80 hover:bg-blue-50 border-blue-200/80',
      normal: 'bg-white hover:bg-gray-50 border-gray-200'
    };

    return (
      <div className={`rounded-2xl p-6 transition-all shadow-lg border-2 ${bgColors[highlightLevel]}`}>
        <div className="flex items-center justify-between mb-3">
          {reminder.time && (
            <div className="flex items-center gap-2 text-2xl md:text-3xl text-blue-700 font-bold">
              <Clock className="w-8 h-8" />
              {format(parseISO(`2000-01-01T${reminder.time}`), 'HH:mm', { locale: fr })}
            </div>
          )}
          {reminder.recurrence_type !== 'NONE' && (
            <div className="flex items-center gap-2 text-lg text-blue-500">
              <span className="text-2xl">🔄</span>
              <span className="font-medium">
                {reminder.recurrence_type === 'DAILY' && 'Daily'}
                {reminder.recurrence_type === 'WEEKLY' && 'Weekly'}
                {reminder.recurrence_type === 'MONTHLY' && `Monthly (Day ${reminder.recurrence_day})`}
              </span>
            </div>
          )}
        </div>
        <p className="text-xl md:text-2xl text-gray-800 font-medium leading-relaxed">
          {reminder.description}
        </p>
        {reminder.assigned_to && (
          <div className="mt-4 flex items-center gap-3 text-blue-600">
            <img
              src={reminder.assigned_to.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100'}
              alt={reminder.assigned_to.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="font-medium">{reminder.assigned_to.name} will do this</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-br from-blue-50 via-blue-100 to-white text-gray-800 p-6 md:p-8">
      {/* Current Date and Time Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-blue-200 max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            {format(now, 'HH:mm', { locale: fr })}
          </h1>
          <h2 className="text-3xl md:text-4xl text-blue-800">
            {format(now, 'EEEE d MMMM', { locale: fr })}
          </h2>
        </div>
      </div>

      {/* Reminders Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Today's Section */}
        <div className="md:col-span-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-blue-200 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-blue-800">Aujourd'hui</h2>
            </div>
            <div className="space-y-4">
              {todayReminders.length > 0 ? (
                todayReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} highlightLevel="high" />
                ))
              ) : (
                <p className="text-xl text-gray-500 text-center py-4">Pas de rappel pour aujourd'hui</p>
              )}
            </div>
          </div>
        </div>

        {/* Tomorrow and Future Section */}
        <div className="space-y-6">
          {/* Tomorrow */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-blue-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-blue-700">Demain</h3>
              <ChevronRight className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-4">
              {tomorrowReminders.length > 0 ? (
                tomorrowReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} highlightLevel="medium" />
                ))
              ) : (
                <p className="text-lg text-gray-500 text-center py-2">No reminders</p>
              )}
            </div>
          </div>

          {/* Rest of the Week */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-700">A venir</h3>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-4">
              {otherReminders.length > 0 ? (
                otherReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))
              ) : (
                <p className="text-lg text-gray-500 text-center py-2">Pas de rappel à venir</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
