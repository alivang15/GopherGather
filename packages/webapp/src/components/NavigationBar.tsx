"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useUserType } from '@/hooks/useUserType';

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
  const userType = useUserType();

  // Prefer full_name from metadata, fallback to local-part of email, then "User"
  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.email ? user.email.split("@")[0] : "User");
  const displayInitial = (displayName?.[0] || "?").toUpperCase();

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
    if (process.env.NODE_ENV !== 'production') {
      if (user) {
        console.log('✅ User signed in:', user.email);
      } else {
        console.log('❌ User signed out');
      }
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link href="/" className="inline-flex items-center -ml-10">
            <Image
              src="/gophergather-logo.png"
              alt="Gopher Gather Logo"
              width={120}
              height={0}
              quality={100}
              priority
            />
          </Link>

          {/* Right Side - User Actions */}
          <div className="flex items-center space-x-4">
            
            {user ? (
              <>
                {/* Debug Info - Remove in production */}
                {/* <div className="hidden md:block text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✅ Signed in as {user.email?.split('@')[0]}
                </div> */}

                {/* Notifications */}
                {/* <button 
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => alert('Notifications feature coming soon!')}
                  title="Notifications (Coming Soon)"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>
                </button> */}

                {/* User Profile Dropdown */}
                <div className="relative" data-profile-dropdown>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-400 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {displayInitial}
                        </span>
                      )}
                    </div>
                  </button>
 
                  {/* Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <p className="font-semibold text-[#7a0019]">Welcome back!</p>
                        <p className="text-sm font-semibold text-gray-600 truncate">{displayName}</p>
                      </div>
                      <div className="p-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                          Profile Settings
                        </Link>
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
                        {(userType === "admin" || user.user_metadata?.user_type === "admin") && (
                          <Link
                            href="/admin/deleted-events"
                            onClick={() => setIsProfileOpen(false)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            Manage Deleted Events
                          </Link>
                        )}
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
