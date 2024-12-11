import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://oqdkwfddbxexdthfavig.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZGt3ZmRkYnhleGR0aGZhdmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MTMyMzksImV4cCI6MjA0NjI4OTIzOX0.6SJHbdRXq1lq2a3SJC-0HSsx9IN9IQerO0TxgIdF42Q";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key);
          return item;
        } catch (error) {
          console.error('Error accessing localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      }
    },
    flowType: 'pkce',
    debug: import.meta.env.DEV
  }
});

// Helper function to get current user with error handling
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Helper function to check Supabase connection
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Setup session refresh interval
let refreshInterval: NodeJS.Timeout | null = null;

export const setupSessionRefresh = async () => {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Set up periodic token refresh (every 23 hours)
  refreshInterval = setInterval(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Error refreshing session:', refreshError);
        }
      }
    } catch (error) {
      console.error('Error in session refresh:', error);
    }
  }, 23 * 60 * 60 * 1000); // 23 hours

  // Initial session check
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error in initial session refresh:', error);
    }
  }

  // Clean up on window unload
  window.addEventListener('unload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
};

// Initialize session refresh
setupSessionRefresh();
