"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { AccountSectionProps } from "@/types";

export default function AccountSection({ user, onAvatarChange, uploading, fileInputRef }: AccountSectionProps) {
  const { resetPassword } = useAuth();

  const handleReset = async () => {
    if (!user?.email) {
      alert("No email found for this account.");
      return;
    }
    try {
      await resetPassword(user.email);
      alert("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      alert(`Failed to send reset email: ${e?.message ?? "Unknown error"}`);
    }
  };

  const initials =
    (user?.user_metadata?.full_name?.split(" ").map((p: string) => p[0]).join("") ||
      user?.email?.[0] ||
      "?")
      .toString()
      .toUpperCase();

  return (
    <>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Account Settings</h3>

      {/* Avatar */}
      <div className="p-4 sm:p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Profile Photo</h4>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-yellow-400 overflow-hidden flex items-center justify-center text-2xl font-bold text-umn-maroon">
            {user?.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-md bg-[#7a0019] text-white text-sm hover:bg-red-800"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change Avatar"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="p-4 sm:p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Security</h4>
        <p className="text-sm text-gray-600 mb-3">
          Send a password reset link to your email.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 rounded-md bg-white border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
        >
          Send Reset Email
        </button>
      </div>
    </>
  );
}