"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfileOverview } from "@/types";

export function useProfileOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: res, error } = await supabase.rpc("get_profile_overview", { uid: user.id });
    if (error) {
      console.error("get_profile_overview error:", error);
      setData(null);
    } else {
      setData(res as ProfileOverview);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  return { data, loading, reload: load };
}
