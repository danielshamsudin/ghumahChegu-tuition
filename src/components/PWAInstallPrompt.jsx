'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app on mobile devices
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');

    if (isStandalone || hasBeenDismissed) {
      return;
    }

    // For iOS, show custom instructions
    if (isIOSDevice && !isStandalone) {
      // Show after 3 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    // For Android/Chrome, use beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  };

  if (!showPrompt) return null;

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Install App on iOS</h3>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To install this app on your iPhone or iPad:
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button{' '}
                    <svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-2V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                    </svg>{' '}
                    at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-xs">
                    3
                  </span>
                  <span>
                    Tap <strong>"Add"</strong> in the top-right corner
                  </span>
                </li>
              </ol>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> This feature only works in Safari browser on iOS devices.
                </p>
              </div>
            </div>

            <Button onClick={handleDismiss} className="w-full mt-6 h-12">
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Install Prompt Banner
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-40 animate-in slide-in-from-bottom duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-md sm:ml-auto">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold mb-1">
                Install TMS App
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Add to your home screen for quick access and offline support
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="flex-1 h-10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isIOS ? 'How to Install' : 'Install'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="bg-gray-50 px-4 sm:px-5 py-3 border-t">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Faster</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Native Feel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to detect if app is installed
 */
export function useIsPWAInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstalled();
    window.addEventListener('resize', checkInstalled);

    return () => {
      window.removeEventListener('resize', checkInstalled);
    };
  }, []);

  return isInstalled;
}
