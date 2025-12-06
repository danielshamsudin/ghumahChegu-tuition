'use client';

import React, { useState } from 'react';
import { signInWithGoogle } from '../../lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { BookOpen, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.jpeg" alt="CLG Logo" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            CLG, Chegu Learning Centre
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage students, classes, and attendance
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Error</p>
                <p className="text-xs sm:text-sm mt-1">{error}</p>
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-medium"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Sign in with Google</span>
                </div>
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-xs sm:text-sm text-center text-gray-500">
                By signing in, you agree to our Terms of Service
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
