"use client";

import { useProfileOverview } from "@/hooks/useProfileOverview";

export default function ProfileSection() {
  const { data, loading } = useProfileOverview();

  const stats = [
    {
      label: "Total Points",
      value: data?.points ?? 0,
      wrap: "bg-red-50 border-red-200",
      num: "text-red-600",
      labelCls: "text-red-700",
    },
    {
      label: "Events Attended",
      value: data?.eventsAttended ?? 0,
      wrap: "bg-green-50 border-green-200",
      num: "text-green-600",
      labelCls: "text-green-700",
    },
    {
      label: "Vibe Checks",
      value: data?.campusImpact?.vibe_checks ?? 0,
      wrap: "bg-blue-50 border-blue-200",
      num: "text-blue-600",
      labelCls: "text-blue-700",
    },
    {
      label: "Photos Shared",
      value: data?.photosShared ?? 0,
      wrap: "bg-yellow-50 border-yellow-200",
      num: "text-yellow-600",
      labelCls: "text-yellow-700",
    },
    {
      label: "Achievements",
      value: data?.achievements ?? 0,
      wrap: "bg-purple-50 border-purple-200",
      num: "text-purple-600",
      labelCls: "text-purple-700",
    },
  ];

  return (
    <>
      {/* Overview */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Overview</h3>
        <p className="text-sm text-gray-600">
          A quick snapshot of your activity and progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border ${s.wrap} p-4 text-center`}
          >
            <div className={`text-2xl font-bold ${s.num} mb-1`}>
              {loading ? "…" : s.value}
            </div>
            <div className={`text-xs ${s.labelCls}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Achievement highlights (compact) — temporarily disabled */}
      {/*
      <div className="rounded-2xl p-4 sm:p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Achievement Highlights
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl mb-1">🦋</div>
            <div className="text-sm font-medium text-gray-900">
              Social Butterfly
            </div>
            <div className="text-xs text-gray-600">10 social events</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-medium text-gray-900">Event Explorer</div>
            <div className="text-xs text-gray-600">5 types attended</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm font-medium text-gray-900">Top 10</div>
            <div className="text-xs text-gray-600">Campus ranking</div>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl mb-1">🦉</div>
            <div className="text-sm font-medium text-gray-900">Night Owl</div>
            <div className="text-xs text-gray-600">5 evening events</div>
          </div>
        </div>
      </div>
      */}

      {/* Each section owns its block; stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-x-6">
        {/* Campus Involvement */}
        <section className="flex-1 min-w-0 flex flex-col rounded-2xl p-4 sm:p-6 mb-4 lg:mb-0">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Campus Involvement
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900">Favorite Event Types</h5>
              <div className="space-y-2 text-gray-600">
                {(data?.favorites ?? []).slice(0, 3).map((f) => (
                  <div
                    key={f.category}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm">{f.category}</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {f.attended} attended
                    </span>
                  </div>
                ))}
                {(!data || (data?.favorites ?? []).length === 0) && (
                  <div className="text-sm text-gray-500">
                    {loading ? "Loading…" : "No data yet"}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900">Campus Impact</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vibe Checks</span>
                  <span className="text-sm font-medium text-gray-500">
                    {loading ? "…" : data?.campusImpact?.vibe_checks ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="flex-1 min-w-0 rounded-2xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-semibold text-gray-600">
                {loading
                  ? "…"
                  : `${Math.min(
                      data?.activeRsvps ?? 0,
                      data?.eventsAttended ?? 0
                    )} events attended`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-semibold text-gray-600">
                {loading ? "…" : `${data?.eventsAttended ?? 0} events attended`}
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}