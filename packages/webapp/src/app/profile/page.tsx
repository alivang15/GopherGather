"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import AccountSection from "@/components/profile/AccountSection";
import LeaderboardSection from "@/components/profile/LeaderboardSection";
import ProfileSection from "@/components/profile/ProfileSection";
import NotificationsSection from "@/components/profile/NotificationsSection";

const sidebarOptions = [
  { key: "account", label: "Account" },
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
  { key: "leaderboard", label: "Leaderboard" },
];

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("account");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    // Fetch user profile data if needed
    if (user) {
      setProfile(user);
      setLoading(false);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    const fileExt = file.name.split('.').pop() || 'jpg';

    // Store inside the avatars bucket under: users/<uid>/avatar-<timestamp>.<ext>
    const filePath = `users/${user.id}/avatar-${Date.now()}.${fileExt}`;

    try {
      // 1) Upload to the avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        alert(
          `Failed to upload avatar. Supabase Storage may not be configured (missing 'avatars' bucket or policies).\n\nDetails: ${uploadError.message}`
        );
        setAvatarUploading(false);
        return;
      }

      // 2) Get public URL and bust cache so the navbar updates immediately
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = data?.publicUrl || '';
      const cacheBustedUrl = `${avatarUrl}?v=${Date.now()}`;

      // 3) Update auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: cacheBustedUrl },
      });

      if (updateError) {
        console.error('Avatar metadata update error:', updateError);
        alert(
          `Failed to update profile avatar. Check Auth permissions/policies.\n\nDetails: ${updateError.message}`
        );
        setAvatarUploading(false);
        return;
      }

      // 4) Update local state and refresh
      setProfile((prev: any) => ({
        ...prev,
        user_metadata: { ...prev?.user_metadata, avatar_url: cacheBustedUrl },
      }));
      setAvatarUploading(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Unexpected avatar error:', err);
      alert(
        `Failed to upload avatar. Supabase may not be set up yet.\n\nDetails: ${err?.message ?? 'Unknown error'}`
      );
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please sign in to view your profile.</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-white px-4 lg:px-8">
      <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
        <aside className="rounded-2xl p-4 md:p-5 lg:sticky lg:top-20">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-2">
            <nav className="flex flex-col gap-1">
              {sidebarOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSelected(opt.key)}
                  className={`text-left px-3 py-2 rounded font-medium transition
                    ${selected === opt.key
                      ? "bg-[#f3e6e8] text-[#7a0019] shadow"
                      : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="bg-white rounded-lg shadow p-4 sm:p-8">            
            {selected === "account" && (
              <AccountSection
                user={user}
                onAvatarChange={handleAvatarChange}
                uploading={avatarUploading}
                fileInputRef={fileInputRef}
              />
            )}
            
            {selected === "profile" && (
              <ProfileSection />
            )}
            {selected === "notifications" && (
              <NotificationsSection />
            )}

            {selected === "leaderboard" && (
              <LeaderboardSection />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
