"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ProfileOverview } from "@/types";
import type { PostgrestError } from "@supabase/supabase-js";

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

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Call RPC with the correct parameter name
    const { data: res, error, status } = await supabase.rpc(
      "get_profile_overview",
      { input_user_id: user.id } // <- was { uid: user.id }
    );

    if (error) {
      // Log useful info and fall back to direct queries so the UI still updates
      const pgErr = error as PostgrestError | null;
      console.warn("get_profile_overview error", {
        status,
        code: pgErr?.code ?? null,
        message: pgErr?.message ?? null,
      });

      // Fallback: compute counts directly
      const { startISO, endISO } = getThisWeekRange();
      const [{ count: lifetime }, { count: weekly }, { count: vibeChecks }] =
        await Promise.all([
          supabase
            .from("rsvps")
            .select("id", { head: true, count: "exact" })
            .eq("user_id", user.id)
            .in("status", ["going", "attended"]),
          supabase
            .from("rsvps")
            .select("id", { head: true, count: "exact" })
            .eq("user_id", user.id)
            .in("status", ["going", "attended"])
            .gte("created_at", startISO)
            .lt("created_at", endISO),
          supabase
            .from("vibe_checks")
            .select("id", { head: true, count: "exact" })
            .eq("user_id", user.id),
        ]);

      setData({
        points: 0,
        eventsAttended: lifetime ?? 0,
        eventsAttendedThisWeek: weekly ?? 0,
        photosShared: 0,
        achievements: 0,
        favorites: [],
        activeRsvps: 0,
        dayStreak: 0,
        campusImpact: { vibe_checks: vibeChecks ?? 0 },
      } as ProfileOverview);
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
        eventsAttendedThisWeek: count ?? 0,
      } as ProfileOverview);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  return { data, loading, reload: load };
}
