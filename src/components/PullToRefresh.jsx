'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Pull-to-refresh indicator component
 * Displays visual feedback during pull-to-refresh gesture
 */
export function PullToRefreshIndicator({ pullState }) {
  const { pullDistance, isRefreshing } = pullState;
  const threshold = 80;
  const progress = Math.min((pullDistance / threshold) * 100, 100);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50 transition-all duration-200"
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        opacity: Math.min(pullDistance / threshold, 1),
      }}
    >
      <div className="bg-white rounded-full shadow-lg p-3 flex items-center justify-center">
        <RefreshCw
          className={`w-5 h-5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'rotate(0deg)' : `rotate(${progress * 3.6}deg)`,
          }}
        />
      </div>
      {!isRefreshing && pullDistance >= threshold && (
        <span className="absolute bottom-0 translate-y-8 text-xs text-gray-600 font-medium">
          Release to refresh
        </span>
      )}
      {isRefreshing && (
        <span className="absolute bottom-0 translate-y-8 text-xs text-gray-600 font-medium">
          Refreshing...
        </span>
      )}
    </div>
  );
}

/**
 * Wrapper component that adds pull-to-refresh functionality
 */
export function PullToRefreshContainer({ children, containerRef, pullState }) {
  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto overscroll-y-contain"
      style={{
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <PullToRefreshIndicator pullState={pullState} />
      <div
        className="transition-transform duration-200"
        style={{
          transform: pullState.isRefreshing ? `translateY(${80}px)` : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
