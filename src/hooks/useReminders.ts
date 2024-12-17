import { useState, useCallback, useEffect } from 'react';
import { supabase, checkConnection } from '../lib/supabase';
import type { Reminder } from '../types';

export function useReminders(familyId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Helper function to handle Supabase errors
  const handleSupabaseError = async (operation: string, err: any) => {
    console.error(`Error ${operation}:`, err);
    
    // Check if it's a connection error
    const isConnected = await checkConnection();
    if (!isConnected && retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      return true; // Should retry
    }
    
    setError(err instanceof Error ? err.message : `Failed to ${operation}`);
    return false; // Should not retry
  };

  // Set up real-time subscription for reminder changes
  useEffect(() => {
    if (!familyId) return;

    const setupChannel = async () => {
      const isConnected = await checkConnection();
      if (!isConnected) {
        setError('Unable to connect to the server. Please check your connection.');
        return;
      }

      const channel = supabase
        .channel('reminders_changes')
        .on('postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'reminders',
            filter: `family_id=eq.${familyId}`
          },
          () => {
            getActiveReminders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupChannel();
  }, [familyId]);

  const getActiveReminders = useCallback(async () => {
    if (!familyId) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          assigned_to:users!reminders_assigned_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .order('date', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
      setRetryCount(0); // Reset retry count on success
      return data as Reminder[];
    } catch (err) {
      const shouldRetry = await handleSupabaseError('fetching reminders', err);
      if (shouldRetry) {
        // Retry after a short delay
        setTimeout(getActiveReminders, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [familyId, retryCount]);

  const assignReminder = async (reminderId: string, userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reminders')
        .update({ assigned_user_id: userId })
        .eq('id', reminderId);

      if (error) throw error;

      // Update local state immediately
      setReminders(prev => prev.map(r => 
        r.id === reminderId 
          ? { ...r, assigned_to: { id: userId, name: '', avatar_url: null } } 
          : r
      ));

      // Fetch updated data to get the complete assigned_to information
      await getActiveReminders();
    } catch (err) {
      const shouldRetry = await handleSupabaseError('assigning reminder', err);
      if (shouldRetry) {
        setTimeout(() => assignReminder(reminderId, userId), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      // Update local state immediately
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (err) {
      const shouldRetry = await handleSupabaseError('deleting reminder', err);
      if (shouldRetry) {
        setTimeout(() => deleteReminder(reminderId), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurringReminders = async (reminder: Reminder) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reminders')
        .delete()
        .match({
          family_id: familyId,
          description: reminder.description,
          recurrence_type: reminder.recurrence_type,
          time: reminder.time
        });

      if (error) throw error;

      // Update local state immediately
      setReminders(prev => prev.filter(r => 
        !(r.description === reminder.description && 
          r.recurrence_type === reminder.recurrence_type && 
          r.time === reminder.time)
      ));
    } catch (err) {
      const shouldRetry = await handleSupabaseError('deleting recurring reminders', err);
      if (shouldRetry) {
        setTimeout(() => deleteRecurringReminders(reminder), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeReminder = async (reminderId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('reminders')
        .update({ is_acknowledged: true })
        .eq('id', reminderId);

      if (error) throw error;

      // Update local state immediately
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, is_acknowledged: true } : r
      ));
    } catch (err) {
      const shouldRetry = await handleSupabaseError('acknowledging reminder', err);
      if (shouldRetry) {
        setTimeout(() => acknowledgeReminder(reminderId), 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    reminders,
    loading,
    error,
    getActiveReminders,
    assignReminder,
    deleteReminder,
    deleteRecurringReminders,
    acknowledgeReminder
  };
}
