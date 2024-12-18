import React, { useState, useEffect } from 'react';
import { Clock, Plus, Bell, Calendar, Loader2, CheckSquare, Users } from 'lucide-react';
import { useReminders } from '../hooks/useReminders';
import type { Family } from '../types';
import { supabase } from '../lib/supabase';

interface ReminderSectionProps {
  families: Family[];
  onSuccess?: () => void;
}

export const ReminderSection: React.FC<ReminderSectionProps> = ({ families, onSuccess }) => {
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [targetAudiences, setTargetAudiences] = useState<Set<'ELDER' | 'FAMILY'>>(new Set());
  const [recurrenceType, setRecurrenceType] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const [recurrenceDay, setRecurrenceDay] = useState<number | null>(null);
  const [selectAllFamilies, setSelectAllFamilies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createReminder } = useReminders(selectedFamilies[0] || '');

  const handleSelectAllFamilies = () => {
    setSelectAllFamilies(!selectAllFamilies);
    setSelectedFamilies(selectAllFamilies ? [] : families.map(f => f.id));
  };

  const handleFamilyToggle = (familyId: string) => {
    setSelectedFamilies(prev => 
      prev.includes(familyId)
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  useEffect(() => {
    setSelectAllFamilies(selectedFamilies.length === families.length);
  }, [selectedFamilies, families]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFamilies.length === 0 || !description || !date || targetAudiences.size === 0) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a reminder for each selected family and audience
      const audiences = Array.from(targetAudiences);
      const promises = selectedFamilies.flatMap(familyId => 
        audiences.map(audience => 
          supabase.from('reminders').insert([{
            description,
            date,
            time: time || null,
            family_id: familyId,
            user_id: user.id,
            target_audience: audience,
            recurrence_type: recurrenceType,
            recurrence_day: recurrenceDay,
            is_acknowledged: false
          }])
        )
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error).map(result => result.error);

      if (errors.length > 0) {
        throw new Error(errors[0].message);
      }

      // Reset form
      setDescription('');
      setDate('');
      setTime('');
      setTargetAudiences(new Set());
      setRecurrenceType('NONE');
      setRecurrenceDay(null);
      setSelectedFamilies([]);
      
      onSuccess?.();
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceToggle = (audience: 'ELDER' | 'FAMILY') => {
    setTargetAudiences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(audience)) {
        newSet.delete(audience);
      } else {
        newSet.add(audience);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Ajouter un rappel</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Partager avec les familles
            </label>
            <button
              type="button"
              onClick={handleSelectAllFamilies}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              {selectAllFamilies ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2">
            {families.map((family) => (
              <label
                key={family.id}
                className="flex items-center p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedFamilies.includes(family.id)}
                  onChange={() => handleFamilyToggle(family.id)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="ml-3 flex items-center gap-3">
                  {family.family_picture ? (
                    <img
                      src={family.family_picture}
                      alt={family.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{family.display_name || family.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            required
            placeholder="Enter reminder description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horaire (optional)
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Le rappel est pour
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={targetAudiences.has('ELDER')}
                onChange={() => handleAudienceToggle('ELDER')}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Senior (Diaporama)</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={targetAudiences.has('FAMILY')}
                onChange={() => handleAudienceToggle('FAMILY')}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">La famille</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Récurrence
          </label>
          <select
            value={recurrenceType}
            onChange={(e) => {
              setRecurrenceType(e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY');
              setRecurrenceDay(null);
            }}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="NONE">Unique</option>
            <option value="DAILY">Journalier</option>
            <option value="WEEKLY">Hebdomadaire</option>
            <option value="MONTHLY">Mensuel</option>
          </select>

          {recurrenceType === 'MONTHLY' && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Month
              </label>
              <select
                value={recurrenceDay || ''}
                onChange={(e) => setRecurrenceDay(parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || selectedFamilies.length === 0 || !description || !date || targetAudiences.size === 0}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Ajouter le rappel
            </>
          )}
        </button>
      </form>
    </div>
  );
};
