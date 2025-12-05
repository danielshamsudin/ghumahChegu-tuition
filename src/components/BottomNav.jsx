'use client';

import React from 'react';
import { Home, Users, Calendar, FileText, BarChart3, Settings, BookOpen, UserPlus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

/**
 * Bottom Navigation Bar for mobile devices
 * Provides quick access to main sections with icon-based navigation
 */
export function BottomNav({ userRole, activeTab, onTabChange }) {
  const pathname = usePathname();

  // Teacher navigation items
  const teacherNavItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attend', icon: Calendar },
    { id: 'invoices', label: 'Invoice', icon: FileText },
    { id: 'classes', label: 'Classes', icon: BookOpen },
  ];

  // Superadmin navigation items
  const superadminNavItems = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'students', label: 'Students', icon: UserPlus },
    { id: 'assignments', label: 'Assign', icon: Calendar },
  ];

  // Determine which nav items to show based on user role and current page
  const getNavItems = () => {
    if (pathname === '/superadmin') {
      return superadminNavItems;
    }
    if (pathname === '/dashboard' || pathname === '/teacher') {
      return teacherNavItems;
    }
    return [];
  };

  const navItems = getNavItems();

  // Don't show bottom nav if no items
  if (navItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bottom nav */}
      <div className="h-20 sm:hidden" />

      {/* Bottom Navigation - Fixed to viewport bottom, only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg rounded-t-2xl shadow-lg border-t border-gray-200 sm:hidden z-50 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange && onTabChange(item.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-all relative first:rounded-tl-2xl last:rounded-tr-2xl ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/**
 * Bottom Navigation for static pages (like dashboard home)
 * Uses Next.js Link for navigation between pages
 */
export function StaticBottomNav({ userRole }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home, roles: ['teacher', 'superadmin'] },
    { href: '/superadmin', label: 'Admin', icon: Settings, roles: ['superadmin'] },
  ];

  // Filter items based on user role
  const visibleItems = navItems.filter(item => item.roles.includes(userRole));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bottom nav */}
      <div className="h-20 sm:hidden" />

      {/* Bottom Navigation - Fixed to viewport bottom, only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg rounded-t-2xl shadow-lg border-t border-gray-200 sm:hidden z-50 safe-bottom">
        <div className={`grid h-16`} style={{ gridTemplateColumns: `repeat(${visibleItems.length}, 1fr)` }}>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-all relative first:rounded-tl-2xl last:rounded-tr-2xl ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
