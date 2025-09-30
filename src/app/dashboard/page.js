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
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold">Tuition Management System</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {currentUser.email}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
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
