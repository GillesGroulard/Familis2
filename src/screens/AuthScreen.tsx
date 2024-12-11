import React, { useState, lazy, Suspense } from 'react';
import { Users } from 'lucide-react';
import { AuthForm } from '../components/auth/AuthForm';

// Lazy load the signup form with a loading fallback
const SignupForm = lazy(() => 
  import('../components/auth/SignupForm').then(module => ({
    default: module.default
  }))
);

const LoadingFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center space-y-4">
      <div className="w-12 h-12 bg-primary-100 rounded-full"></div>
      <div className="h-4 w-24 bg-primary-100 rounded"></div>
    </div>
  </div>
);

export const AuthScreen = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        
        {mode === 'signup' && (
          <button
            onClick={() => setMode('login')}
            className="mt-2 w-full text-center text-sm text-primary-500 hover:text-primary-400"
          >
            ← Back to login
          </button>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          {mode === 'login' ? (
            <AuthForm
              onSignupClick={() => setMode('signup')}
            />
          ) : (
            <Suspense fallback={<LoadingFallback />}>
              <SignupForm
                onSuccess={() => setMode('login')}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};