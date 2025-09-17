'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { logOut } from '../../lib/firebaseAuth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

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
          {(userRole === 'teacher' || userRole === 'superadmin') && (
            <a
              href="/teacher"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block"
            >
              Teacher Panel
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
