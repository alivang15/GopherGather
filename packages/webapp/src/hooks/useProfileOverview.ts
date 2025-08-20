"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfileOverview } from "@/types";

export function useProfileOverview() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Monday 00:00 local -> next Monday 00:00 local
  function getThisWeekRange() {
    const now = new Date();
    const day = now.getDay(); // Sun=0..Sat=6
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: res, error } = await supabase.rpc("get_profile_overview", { uid: user.id });
    if (error) {
      console.error("get_profile_overview error:", error);
      setData(null);
    } else {
      // Weekly RSVPs (going) created this week
      const { startISO, endISO } = getThisWeekRange();
      const { count, error: weekErr } = await supabase
        .from("rsvps")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "going")
        .gte("created_at", startISO)
        .lt("created_at", endISO);
      if (weekErr) console.warn("weekly RSVPs count error:", weekErr);
      setData({
        ...(res as ProfileOverview),
        // prefer 0 when null/undefined
        eventsAttendedThisWeek: count ?? 0,
      } as ProfileOverview);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
  }, [user]);

  return { data, loading, reload: load };
}
