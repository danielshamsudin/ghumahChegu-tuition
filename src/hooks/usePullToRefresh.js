'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for implementing pull-to-refresh functionality on mobile devices
 * @param {Function} onRefresh - Callback function to execute when refresh is triggered
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Distance in pixels to trigger refresh (default: 80)
 * @param {boolean} options.enabled - Whether pull-to-refresh is enabled (default: true)
 * @returns {Object} - Contains pullState and containerRef
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const {
    threshold = 80,
    enabled = true,
  } = options;

  const [pullState, setPullState] = useState({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  });

  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchMoveY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId = null;

    const handleTouchStart = (e) => {
      // Only start if scrolled to top
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setPullState(prev => ({ ...prev, isPulling: true }));
      }
    };

    const handleTouchMove = (e) => {
      if (!pullState.isPulling && container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setPullState(prev => ({ ...prev, isPulling: true }));
      }

      if (pullState.isPulling || container.scrollTop === 0) {
        touchMoveY.current = e.touches[0].clientY;
        const pullDistance = Math.max(0, touchMoveY.current - touchStartY.current);

        // Only prevent default if pulling down from top
        if (pullDistance > 0 && container.scrollTop === 0) {
          e.preventDefault();

          // Apply resistance: slower pull as distance increases
          const resistance = 2.5;
          const adjustedDistance = pullDistance / resistance;

          rafId = requestAnimationFrame(() => {
            setPullState(prev => ({
              ...prev,
              pullDistance: Math.min(adjustedDistance, threshold * 1.5),
            }));
          });
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullState.pullDistance >= threshold && !pullState.isRefreshing) {
        setPullState(prev => ({
          ...prev,
          isRefreshing: true,
          isPulling: false,
        }));

        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh error:', error);
        } finally {
          setTimeout(() => {
            setPullState({
              isPulling: false,
              isRefreshing: false,
              pullDistance: 0,
            });
          }, 300);
        }
      } else {
        setPullState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
        });
      }

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [enabled, onRefresh, pullState.isPulling, pullState.isRefreshing, pullState.pullDistance, threshold]);

  return {
    pullState,
    containerRef,
  };
}
