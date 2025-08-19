import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WeekEvent, TopEvent, TopGoer, PopularCategory } from "@/types";

export default function LeaderboardSection() {
  const [stats, setStats] = useState<{
    totalStudents: number | null;
    totalEvents: number | null;
    totalRsvps: number | null;
    eventsThisWeek: WeekEvent[] | null;
    topGoers: TopGoer[] | null;
    topEvents: TopEvent[];
    popularCategories: PopularCategory[];
  }>({
    totalStudents: null,
    totalEvents: null,
    totalRsvps: null,
    eventsThisWeek: null,
    topGoers: null,
    topEvents: [],
    popularCategories: [],
  });

  useEffect(() => {
    let alive = true;

    const toPublicAvatar = (path?: string | null) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl ?? null;
    };

    const fetchAll = async () => {
      // Compute week [Mon .. nextMon)
      const now = new Date();
      const day = now.getDay(); // 0..6
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);

      const startISO = monday.toISOString();
      const nextISO = nextMonday.toISOString();

      const [
        totalStudentsP,
        eventsCountP,
        rsvpsCountP,
        weekEventsP,
        topGoersP,
        trendingP,
        categoriesP,
      ] = await Promise.all([
        supabase.rpc("get_total_students"),
        supabase.from("events").select("*", { head: true, count: "exact" }),
        supabase.from("rsvps").select("*", { head: true, count: "exact" }),
        supabase
          .from("events")
          .select("id,title,date,going_count")
          .gte("date", startISO)
          .lt("date", nextISO)
          .eq("status", "approved")
          .is("permanently_deleted_at", null)
          .is("deleted_at", null)
          .order("date"),
        supabase.rpc("get_top_event_goers", { limit_count: 5 }),
        supabase.rpc("get_trending_events", { limit_count: 5 }),
        supabase.rpc("get_popular_categories", { limit_count: 5 }),
      ]);

      if (!alive) return;

      const totalStudents = totalStudentsP.error ? null : Number(totalStudentsP.data ?? 0);
      const totalEvents = eventsCountP.error ? null : eventsCountP.count ?? 0;
      const totalRsvps = rsvpsCountP.error ? null : rsvpsCountP.count ?? 0;

      const eventsThisWeek = weekEventsP.error ? null : ((weekEventsP.data as WeekEvent[]) ?? []);

      const topGoers = topGoersP.error
        ? []
        : ((topGoersP.data ?? []).map((g: any) => ({
            user_id: g.user_id as string,
            email: g.email ?? null,
            first_name: g.first_name ?? null,
            last_name: g.last_name ?? null,
            going_count: Number(g.going_count ?? 0),
            avatar_url: toPublicAvatar(g.avatar_url),
          })) as TopGoer[]);

      const topEvents = trendingP.error ? [] : (((trendingP.data ?? []) as TopEvent[]));

      // Popular categories: compute relative percentages based on max count, take top 5
      const rawCats = categoriesP.error ? [] : ((categoriesP.data as any[]) ?? []);
      const cleaned = rawCats
        .filter((c) => c.category)
        .map((c) => ({ category: String(c.category), count: Number(c.cnt ?? 0) }));
      const maxCount = Math.max(1, ...cleaned.map((c) => c.count));
      const popularCategories: PopularCategory[] = cleaned
        .map((c) => ({
          ...c,
          percentage: Math.round((c.count / maxCount) * 100),
        }))
        .slice(0, 5);

      setStats({
        totalStudents,
        totalEvents,
        totalRsvps,
        eventsThisWeek,
        topGoers,
        topEvents,
        popularCategories,
      });
    };

    fetchAll();
    return () => {
      alive = false;
    };
  }, []);

  const initials = (first?: string | null, last?: string | null, email?: string | null) => {
    const f = (first?.trim()?.[0] ?? "").toUpperCase();
    const l = (last?.trim()?.[0] ?? "").toUpperCase();
    if (f || l) return `${f}${l}`;
    return (email?.[0] || "?").toUpperCase();
  };

  // Totals for "Events This Week" summary
  const totalWeekEvents =
    stats.eventsThisWeek === null ? null : (stats.eventsThisWeek?.length ?? 0);

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Community Leaderboard</h1>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Celebrate our most active community members and discover the hottest events on campus
        </p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="text-center border rounded-xl bg-white">
          <div className="pt-5 pb-4 px-4">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalStudents === null ? "…" : stats.totalStudents.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
        </div>
        <div className="text-center border rounded-xl bg-white">
          <div className="pt-5 pb-4 px-4">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalEvents === null ? "…" : stats.totalEvents.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total Events</p>
          </div>
        </div>
        <div className="text-center border rounded-xl bg-white">
          <div className="pt-5 pb-4 px-4">
            <div className="text-3xl mb-2">🎖️</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.totalRsvps === null ? "…" : stats.totalRsvps.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Total RSVPs</p>
          </div>
        </div>
        <div className="text-center border rounded-xl bg-white">
          <div className="pt-5 pb-4 px-4">
            <div className="text-3xl mb-2">🏅</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {stats.eventsThisWeek === null ? "…" : (stats.eventsThisWeek.length || 0).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Events This Week</p>
          </div>
        </div>
      </div>

      {/* Main Leaderboards */}
      <div className="flex flex-col gap-6 md:gap-8 mb-10">
        {/* Top Event Goers */}
        <div className="border rounded-2xl p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Top Event Goers</h3>
          <div className="space-y-3">
            {stats.topGoers === null ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : stats.topGoers.length === 0 ? (
              <div className="text-sm text-gray-500">No data yet.</div>
            ) : (
              stats.topGoers.map((u, index) => (
                <div key={u.user_id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-400 text-umn-maroon' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-600'}`}
                  >
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#7a0019] text-white flex items-center justify-center">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt={`${(u.first_name || u.email || "User") as string} avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials(u.first_name, u.last_name, u.email)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {(u.first_name || "").trim()} {(u.last_name || "").trim() || ""}
                    </div>
                    <div className="text-sm text-gray-600">{u.going_count} going RSVPs</div>
                  </div>
                  {index < 3 && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : '3rd Place'}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending Events */}
        <div className="border rounded-2xl p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Trending Events</h3>
          <div className="space-y-3">
            {stats.topEvents.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                  {ev.rsvps}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{ev.title}</div>
                  <div className="text-sm text-gray-600">Category: {ev.category}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-[#f3e6e8] text-[#7a0019]">Hot</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="border rounded-2xl p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-green-600">📊</span> Popular Categories
        </h3>
        <div className="space-y-4">
          {stats.popularCategories.length === 0 ? (
            <div className="text-sm text-gray-500">No data yet.</div>
          ) : (
            stats.popularCategories.map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{cat.category}</span>
                    <span className="text-sm text-gray-600">{cat.count} events</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-200">
                    <div
                      className="h-2.5 rounded-full bg-[#7a0019]"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500">{cat.percentage}%</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Events This Week list (small) */}
      <div className="border rounded-2xl p-4 md:p-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Events This Week</h3>
          <div className="text-sm text-gray-600">
            {totalWeekEvents === null ? "…" : `Total: ${totalWeekEvents.toLocaleString()} events`}
          </div>
        </div>
        {stats.eventsThisWeek === null ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : stats.eventsThisWeek.length === 0 ? (
          <div className="text-sm text-gray-500">No approved events this week.</div>
        ) : (
          <div className="space-y-2">
            {stats.eventsThisWeek.map((ev: WeekEvent) => (
              <div key={ev.id} className="flex items-center justify-between">
                <div className="text-sm text-gray-800 truncate">{ev.title}</div>
                <div className="text-xs text-gray-500">
                  {ev.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}