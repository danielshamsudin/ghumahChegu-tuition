'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SuperadminPage() {
  const { currentUser, userRole, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!currentUser || userRole !== 'superadmin') {
        router.push('/dashboard'); // Redirect if not superadmin or not logged in
      }
    }
  }, [loading, currentUser, userRole, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser && userRole === 'superadmin') {
        const usersCollectionRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollectionRef);
        const usersList = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersList);
      }
    };

    fetchUsers();
  }, [currentUser, userRole]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(prevUsers =>
        prevUsers.map(user => (user.id === userId ? { ...user, role: newRole } : user))
      );
      setMessage(`Successfully updated role for user ${userId} to ${newRole}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      setMessage(`Failed to update role for user ${userId}: ${error.message}`);
    }
  };

  if (loading || !currentUser || userRole !== 'superadmin') {
    return <div className="min-h-screen flex items-center justify-center">Loading or unauthorized...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Superadmin User Management</h1>
      {message && <p className="text-center text-green-600 mb-4">{message}</p>}
      <div className="overflow-x-auto bg-white rounded shadow-md">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap capitalize">{user.role}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
