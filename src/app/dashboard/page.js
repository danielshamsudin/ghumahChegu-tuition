'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import TeacherHomepage from '../../components/TeacherHomepage';
import { Button } from '../../components/ui/button';
import { LogOut, Settings, Shield } from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Show teacher homepage for teachers
  if (userRole === 'teacher') {
    return (
      <div className="relative min-h-screen bg-gray-50">
        {/* Mobile-first navigation bar for teachers */}
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-base sm:text-xl font-semibold truncate flex items-center gap-2">
                <img src="/logo.jpeg" alt="CLC Logo" className="w-8 h-8 rounded" />
                <span className="hidden sm:inline">CLC, Chegu Learning Centre</span>
                <span className="sm:hidden">CLC</span>
              </h1>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:block text-sm text-gray-600 truncate max-w-[200px]">
                  {currentUser.email}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log Out</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <TeacherHomepage />
      </div>
    );
  }

  // Mobile-first default dashboard for other roles
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8">
          {/* User Avatar */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full mb-4 text-2xl sm:text-3xl font-bold">
              {currentUser.email?.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 break-all px-2">
              {currentUser.email}
            </p>
          </div>

          {/* Role Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Role:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 capitalize">
              {userRole}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            {userRole === 'superadmin' && (
              <>
                <Button
                  onClick={() => router.push('/superadmin')}
                  className="w-full h-12 sm:h-14 text-base font-medium"
                  size="lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Superadmin Panel
                </Button>
                <Button
                  onClick={() => router.push('/teacher')}
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-base font-medium"
                  size="lg"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Legacy Teacher Panel
                </Button>
              </>
            )}
          </div>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full h-12 sm:h-14 text-base font-medium"
            size="lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
