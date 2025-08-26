"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { AccountSectionProps } from "@/types";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AccountSection({ user, onAvatarChange, uploading, fileInputRef }: AccountSectionProps) {
  const { resetPassword } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // user is editing

  // Initialize once per user id; don't clobber while user is typing
  useEffect(() => {
    if (!user || isDirty) return;
    const full = user.user_metadata?.full_name as string | undefined;
    const initial =
      (full && full.trim()) ||
      (user.email ? user.email.split("@")[0] : "");
    setDisplayName(initial || "");
  }, [user, isDirty]);

  // Reset dirty flag when the signed-in user changes
  useEffect(() => {
    setIsDirty(false);
  }, [user?.id]);

  const handleReset = async () => {
    if (!user?.email) {
      alert("No email found for this account.");
      return;
    }
    try {
      await resetPassword(user.email);
      alert("Password reset email sent. Check your inbox.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? "Unknown error");
      alert(`Failed to send reset email: ${msg}`);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName || displayName.trim().length === 0) {
      alert("Please enter a display name.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });
      if (error) throw error;
      alert("Display name updated.");
      // Optional: if your AuthContext exposes refreshUser, call it here to propagate without reload.
      // await refreshUser?.();
      setIsDirty(false);
    } catch (e: unknown) {
      console.error("update display name failed:", e);
      const msg = e instanceof Error ? e.message : String(e ?? "Unknown error");
      alert(`Failed to update display name: ${msg}`);
    } finally {
      setSaving(false);
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

      {/* Display name */}
      <div className="p-4 sm:p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Display Name</h4>
        <p className="text-sm text-gray-600 mb-3">This name will be shown across the site instead of your email local-part.</p>
        <div className="flex items-center gap-3 max-w-md">
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
            className="flex-1 px-3 py-2 border rounded-md"
            placeholder="Display name"
            aria-label="Display name"
          />
          <button
            type="button"
            onClick={handleSaveDisplayName}
            disabled={saving}
            className="px-3 py-2 rounded-md bg-[#7a0019] text-white text-sm hover:bg-red-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
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