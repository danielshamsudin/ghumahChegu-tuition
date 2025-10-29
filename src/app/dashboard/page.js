'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/firebaseAuth';
import { useRouter } from 'next/navigation';
import TeacherHomepage from '../../components/TeacherHomepage';
import { Button } from '../../components/ui/button';

export default function DashboardPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
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
      <div className="relative">
        {/* Navigation bar for teachers */}
        <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex justify-between items-center gap-2">
              <h1 className="text-base md:text-xl font-semibold truncate flex-1">Tuition Management System</h1>
              <div className="flex items-center gap-2 md:gap-4">
                <span className="hidden sm:inline text-sm text-gray-600 truncate max-w-[200px]">Welcome, {currentUser.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="whitespace-nowrap">
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <TeacherHomepage />
      </div>
    );
  }

  // Default dashboard for other roles
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg mb-2">Welcome, {currentUser.email}!</p>
        <p className="text-md mb-6">Your role: <span className="font-semibold capitalize">{userRole}</span></p>
        <div className="flex flex-col space-y-4 mb-4">
          {userRole === 'superadmin' && (
            <a
              href="/superadmin"
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block"
            >
              Superadmin Panel
            </a>
          )}
          {userRole === 'superadmin' && (
            <a
              href="/teacher"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block"
            >
              Legacy Teacher Panel
            </a>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
