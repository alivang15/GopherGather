"use client"
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/auth-helpers-nextjs';

export default function CreateProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    checkSession();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Update user profile in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password,
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
          bio,
          // Add other fields here
        }
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold mb-4">Profile updated!</h2>
        <p>Your account settings have been saved.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded shadow w-full max-w-md text-center">
          <h2 className="text-xl font-bold mb-4 text-red-700">Session Expired</h2>
          <p className="mb-4 text-gray-700">
            Your session has expired or is invalid. Please sign in to finish setting up your account.
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-block px-4 py-2 bg-[#7a0019] text-white rounded font-medium"
          >
            Sign In
          </Link>
          <div className="mt-4">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-[#7a0019] underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <form className="bg-white p-8 rounded shadow w-full max-w-md space-y-4" onSubmit={handleProfileSubmit}>
        <h2 className="text-xl text-gray-800 font-bold mb-2">Set up your profile</h2>
        <label className="block text-gray-800 text-sm font-medium">First Name</label>
        <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full text-gray-600 border rounded px-3 py-2" />
        <label className="block text-gray-800 text-sm font-medium">Last Name</label>
        <input value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full text-gray-600 border rounded px-3 py-2" />
        <label className="block text-gray-800 text-sm font-medium">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full text-gray-600 border rounded px-3 py-2" />
        {/* Add more fields as needed */}
        <button type="submit" disabled={loading} className="w-full bg-[#7a0019] text-white py-2 rounded font-medium mt-4">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}
