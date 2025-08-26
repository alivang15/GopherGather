"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type VibeCheck = {
  id: string;
  event_id: string;
  user_name: string;
  user_email?: string;
  vibe_rating: number;
  vibe_emoji: string;
  comment: string | null;
  created_at: string;
};

const VIBE_OPTIONS = [
  { value: 1, label: "Boring", emoji: "😩" },
  { value: 2, label: "Meh", emoji: "😐" },
  { value: 3, label: "Good", emoji: "😊" },
  { value: 4, label: "Great", emoji: "😁" },
  { value: 5, label: "Lit", emoji: "🔥" },
];

export default function VibeCheckPanel({ eventId, eventTitle }: { eventId: string; eventTitle?: string }) {
  const { user, loading: authLoading } = useAuth();
  const [vibeChecks, setVibeChecks] = useState<VibeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Determine admin/club_admin from auth metadata; fallback to users table
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const metaType = (user.user_metadata?.user_type || user.user_metadata?.role) as string | undefined;
    if (metaType) {
      setIsAdmin(metaType === "admin" || metaType === "club_admin");
      return;
    }
    // Fallback: read your profile row to get user_type
    supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.user_type === "admin" || data?.user_type === "club_admin");
      });
  }, [user]);

  useEffect(() => {
    if (user) {
      const full = user.user_metadata?.full_name;
      const base = full && full.trim() ? full : (user.email?.split("@")[0] ?? "");
      setUserName(base.charAt(0).toUpperCase() + base.slice(1));
    }
  }, [user]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      // Fetch ALL vibe checks (stats use all; list shows only those with comments)
      const { data, error } = await supabase
        .from("vibe_checks")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      if (!error) setVibeChecks(data || []);
      setLoading(false);
    };
    run();
  }, [eventId]);

  const submit = async () => {
    if (!user || !selectedVibe || !userName.trim()) return;
    setSubmitting(true);
    const vibe = VIBE_OPTIONS.find(v => v.value === selectedVibe);
    const { data, error } = await supabase.from("vibe_checks").insert([{
      event_id: eventId,
      user_name: userName.trim(),
      user_email: user.email,
      vibe_rating: selectedVibe,
      vibe_emoji: vibe?.emoji ?? "😊",
      comment: comment.trim()
    }]).select().single();
    if (!error && data) {
      setVibeChecks(prev => [data, ...prev]);
      setSelectedVibe(null);
      setComment("");
    }
    setSubmitting(false);
  };

  const deleteComment = async (checkId: string) => {
    if (!user) return;
    const prompt = isAdmin ? "Delete this comment? (as an admin)" : "Delete your comment for this vibe check?";
    if (!confirm(prompt)) return;

    setDeletingId(checkId);
    // Admin may moderate any comment; regular users can only delete their own
    let query = supabase.from("vibe_checks").update({ comment: null }).eq("id", checkId);
    if (!isAdmin) {
      query = query.eq("user_email", user.email!);
    }
    const { error } = await query;
    if (!error) setVibeChecks(prev => prev.filter(vc => vc.id !== checkId));
    setDeletingId(null);
  };

  // Helpers for stats (same as the original modal)
  const getAverageVibe = () => {
    if (vibeChecks.length === 0) return null;
    const avg = vibeChecks.reduce((sum, c) => sum + (c.vibe_rating || 0), 0) / vibeChecks.length;
    return Math.round(avg * 10) / 10;
  };

  const getVibeDistribution = () => {
    // Highest-first (5 -> 1), so 🔥 appears at the top
    return VIBE_OPTIONS
      .map((opt) => ({
        ...opt,
        count: vibeChecks.filter((c) => c.vibe_rating === opt.value).length,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const visibleComments = vibeChecks.filter(vc => vc.comment && vc.comment.trim().length > 0);

  const fmt = (s: string) => new Date(s).toLocaleString();

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold to-black">Vibe Check</h1>
        {eventTitle && <p className="text-sm text-gray-600">{eventTitle}</p>}
      </header>

      {/* Stats — Average + Distribution (visible when there’s any data) */}
      {vibeChecks.length > 0 && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-[#f3e6e8] to-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#7a0019]">{getAverageVibe()}/5</div>
              <div className="text-sm text-gray-600">Average Vibe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#7a0019]">{vibeChecks.length}</div>
              <div className="text-sm text-gray-600">Total Checks</div>
            </div>
          </div>
          <div className="space-y-2">
            {getVibeDistribution().map(v => {
              const pct = vibeChecks.length > 0 ? (v.count / vibeChecks.length) * 100 : 0;
              return (
                <div key={v.value} className="flex items-center gap-2">
                  <span className="text-lg">{v.emoji}</span>
                  <span className="text-sm text-gray-700 w-16">{v.label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-[#7a0019] h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{v.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!user ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="mb-4">Please sign in to submit a vibe check.</p>
          <a href="/auth/sign-in" className="px-4 py-2 bg-purple-600 text-white rounded">Sign In</a>
        </div>
      ) : (
        <>
          {/* Submit area */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {VIBE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setSelectedVibe(v.value)}
                  className={`p-3 rounded border ${selectedVibe === v.value ? "border-[#7a0019] bg-[#f3e6e8]" : "border-gray-300 bg-white"}`}
                >
                  <div className="text-2xl text-center">{v.emoji}</div>
                  <div className="text-xs text-center">{v.label}</div>
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about the vibe..."
              className="w-full px-3 py-2 border rounded mb-3"
              rows={3}
              maxLength={200}
            />
            <button
              onClick={submit}
              disabled={!selectedVibe || !userName.trim() || submitting}
              className="w-full bg-[#7a0019] hover:bg-red-800 text-white py-2 rounded disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Vibe Check"}
            </button>
          </div>

          {/* Comments list (only rows with comment) */}
          <section>
            <h2 className="font-semibold mb-3">Recent Vibe Checks ({visibleComments.length})</h2>
            {loading ? (
              <div>Loading...</div>
            ) : visibleComments.length === 0 ? (
              <div className="text-gray-500">No comments yet.</div>
            ) : (
              <div className="space-y-3">
                {visibleComments.map(vc => (
                  <div key={vc.id} className="border rounded p-3">
                    <div className="flex items-start justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{vc.user_name}</div>
                        <div className="text-gray-500 text-xs">{fmt(vc.created_at)}</div>
                      </div>
                      {user && (vc.user_email === user.email || isAdmin) && (
                        <button
                          onClick={() => deleteComment(vc.id)}
                          disabled={deletingId === vc.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === vc.id ? "Deleting..." : vc.user_email === user.email ? "Delete" : "Delete (admin)"}
                        </button>
                      )}
                    </div>
                    {vc.comment && <p className="text-sm text-gray-700 mt-2">{vc.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}