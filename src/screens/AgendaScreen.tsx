import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useReminders } from '../hooks/useReminders';
import { SharedSidebar } from '../components/SharedSidebar';
import { Toast } from '../components/Toast';
import { useNavigation } from '../hooks/useNavigation';
import { supabase } from '../lib/supabase';
import { getRemindersForDate } from '../utils/reminderUtils';
import { ReminderList } from '../components/reminders/ReminderList';
import { CalendarDay } from '../components/reminders/CalendarDay';
import { fr } from 'date-fns/locale';  // Ligne 1

interface AgendaScreenProps {
  familyId: string | null;
}

export const AgendaScreen: React.FC<AgendaScreenProps> = ({ familyId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const { reminders, loading, error, getActiveReminders, acknowledgeReminder, assignReminder, deleteReminder, deleteRecurringReminders } = useReminders(familyId || '');
  const { navigateToPhotos } = useNavigation();

  useEffect(() => {
    if (familyId) {
      getActiveReminders();
    }
  }, [familyId, getActiveReminders]);

  const handleFamilyChange = (id: string) => {
    window.location.hash = `family/${id}`;
  };

  const handleJoinFamily = () => {
    window.location.hash = 'join';
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setExpandedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setExpandedDay(null);
  };

  const handleDayClick = (day: Date) => {
    if (expandedDay && isSameDay(expandedDay, day)) {
      setExpandedDay(null);
    } else {
      setExpandedDay(day);
    }
  };

  const handleTakeCharge = async (reminderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await assignReminder(reminderId, user.id);
      setSuccess("You've taken charge of this reminder!");
    } catch (err) {
      console.error('Error assigning reminder:', err);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
      setSuccess('Reminder has been removed');
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const handleDeleteRecurring = async (reminder: Reminder) => {
    try {
      await deleteRecurringReminders(reminder);
      setSuccess('All occurrences of the recurring reminder have been removed');
    } catch (err) {
      console.error('Error deleting recurring reminder:', err);
    }
  };

  const handleAddReminder = () => {
    navigateToPhotos();
  };

  if (!familyId) {
    return (
      <>
        <SharedSidebar
          currentFamilyId={familyId}
          onFamilyChange={handleFamilyChange}
          onJoinFamily={handleJoinFamily}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          currentPage="feed"
        />
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Choisir une famille
            </h2>
            <p className="text-gray-600">
              Choisissez une famille sur la menu à gauche pour voir leur agenda
            </p>
          </div>
        </div>
      </>
    );
  }

const familyReminders = reminders.filter(r => r.target_audience === 'FAMILY' && !r.deleted);

return (
  <>
    <SharedSidebar
      currentFamilyId={familyId}
      onFamilyChange={handleFamilyChange}
      onJoinFamily={handleJoinFamily}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      currentPage="feed"
    />
    
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${!isCollapsed ? 'pl-24' : ''}`}>
      <div className="container mx-auto px-4 py-8 pb-32">
        {/* Family Reminders Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Rappels de la famille</h2>
              <button
                onClick={handleAddReminder}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un rappel</span>
              </button>
            </div>

            <ReminderList
              reminders={familyReminders}
              onDelete={handleDeleteReminder}
              onDeleteRecurring={handleDeleteRecurring}
              onTakeCharge={handleTakeCharge}
            />
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Calendar</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-lg font-medium text-gray-700 min-w-[140px] text-center">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden relative">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 text-center py-3 text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
              
              {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map((day, idx) => (
                <CalendarDay
                  key={idx}
                  day={day}
                  reminders={getRemindersForDate(reminders, day, currentDate)}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  isToday={isSameDay(day, new Date())}
                  isExpanded={expandedDay ? isSameDay(day, expandedDay) : false}
                  onClick={() => handleDayClick(day)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for expanded day */}
      <div 
        className={`calendar-overlay ${expandedDay ? 'visible' : ''}`}
        onClick={() => setExpandedDay(null)}
      />

      {success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  </>
);
};

export default AgendaScreen;
