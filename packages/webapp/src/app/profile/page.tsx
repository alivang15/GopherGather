"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import AccountSection from "@/components/profile/AccountSection";
import ProfileSection from "@/components/profile/ProfileSection";
import LeaderboardSection from "@/components/profile/LeaderboardSection";
import NotificationsSection from "@/components/profile/NotificationsSection";

const VALID_SECTIONS = ["account", "profile", "leaderboard", "notifications"] as const;
type Section = (typeof VALID_SECTIONS)[number];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams?.get("section") ?? "account";
  const initial = VALID_SECTIONS.includes(param as Section) ? (param as Section) : "account";

  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<Section>(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setProfile(user ?? null);
  }, [user]);

  useEffect(() => {
    const s = searchParams?.get("section") ?? "account";
    if (VALID_SECTIONS.includes(s as Section) && s !== selected) {
      setSelected(s as Section);
    }
  }, [searchParams, selected]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/png", "image/jpg"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG and JPG image files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      alert("Image file size must be 2MB or less.");
      e.target.value = "";
      return;
    }

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

  const selectTab = (s: Section) => {
    setSelected(s);
    // update query param without page reload
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("section", s);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (authLoading) {
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
              {VALID_SECTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => selectTab(opt)}
                  className={`text-left px-3 py-2 rounded font-medium transition
                    ${selected === opt
                      ? "bg-[#f3e6e8] text-[#7a0019] shadow"
                      : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
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
