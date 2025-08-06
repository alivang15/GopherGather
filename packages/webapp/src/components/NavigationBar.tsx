"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

/**
 * NavigationBar Component
 * 
 * Main navigation bar with logo and user actions
 * Used in: Root layout for all pages
 */
export default function NavigationBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Force re-render when user state changes
  useEffect(() => {
    if (user) {
      console.log('✅ User signed in:', user.email);
    } else {
      console.log('❌ User signed out');
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
      router.push('/'); // Redirect to home after sign out
      router.refresh(); // Force refresh
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/gophergather-logo.png"
                alt="Gopher Gather"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="inline-flex items-center -ml-15">
            <Image
              src="/gophergather-logo.png"
              alt="Gopher Gather Logo"
              width={120}
              height={40}
              quality={100}
              className="h-50 w-50"
              priority
            />
          </Link>

          {/* Right Side - User Actions */}
          <div className="flex items-center space-x-4">
            
            {user ? (
              <>
                {/* Debug Info - Remove in production */}
                <div className="hidden md:block text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ Signed in as {user.email?.split('@')[0]}
                </div>

                {/* Notifications */}
                <button 
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => alert('Notifications feature coming soon!')}
                  title="Notifications (Coming Soon)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.405-3.405A2.032 2.032 0 0118 12.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v1.159c0 .538-.214 1.055-.595 1.436L2 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                {/* User Profile Dropdown */}
                <div className="relative" data-profile-dropdown>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-800">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <p className="font-semibold text-gray-900">Welcome back!</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <p className="text-xs text-green-600">✅ Authenticated</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={() => {
                            alert('Profile page coming soon!');
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Profile Settings
                        </button>
                        <button 
                          onClick={() => {
                            alert('My Events page coming soon!');
                            setIsProfileOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          My Events
                        </button>
                        <Link
                          href="/admin/create-event"
                          onClick={() => setIsProfileOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Create Event
                        </Link>
                        <Link
                          href="/admin/deleted-events"
                          onClick={() => setIsProfileOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Manage Deleted Events
                        </Link>
                        <hr className="my-2" />
                        <button 
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Show Sign In button when not authenticated */
              <div className="flex items-center space-x-2">
                <div className="hidden md:block text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  Not signed in
                </div>
                <Link
                  href="/auth/sign-in"
                  className="px-4 py-2 bg-[#7a0019] text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
