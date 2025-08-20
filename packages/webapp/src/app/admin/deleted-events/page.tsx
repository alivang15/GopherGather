"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types";

export default function DeletedEventsPage() {
  const [deletedEvents, setDeletedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Record<string, "restore" | "delete" | undefined>>({});

  useEffect(() => {
    async function fetchDeletedEvents() {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .not("deleted_at", "is", null)
        .is("permanently_deleted_at", null);
      if (error) {
        setError("Failed to load deleted events: " + error.message);
        setDeletedEvents([]);
      } else {
        setDeletedEvents(data || []);
      }
      setLoading(false);
    }
    fetchDeletedEvents();

    // Realtime: if another admin permanently deletes/restores, keep list in sync
    const channel = supabase
      .channel("deleted-events-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "events" }, (payload: any) => {
        const row = payload.new;
        if (!row) return;
        // Remove if it just became permanently deleted or restored (deleted_at null)
        if (row.permanently_deleted_at || row.deleted_at === null) {
          setDeletedEvents((prev) => prev.filter((e) => e.id !== row.id));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // .eq("permanently_deleted_at", null); up there
  const handleRestore = async (id: string) => {
    setError("");
    setPending((p) => ({ ...p, [id]: "restore" }));
    try {
     // Prefer admin RPC if present (bypasses RLS and enforces admin)
     const { error } =
       (await supabase.rpc("admin_restore_event", { p_event_id: id })).error
         ? await supabase.rpc("admin_restore_event", { p_event_id: id }) // retry once
         : { error: null as any };
     // Fallback to direct update if RPC not available (optional)
     if (error?.message?.includes("function admin_restore_event")) {
       const fallback = await supabase.from("events").update({ deleted_at: null, permanently_deleted_at: null }).eq("id", id);
       if (fallback.error) throw fallback.error;
     } else if (error) {
       throw error;
     }
      // Remove from list immediately
      setDeletedEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      setError("Failed to restore event: " + (e?.message || "Unknown error"));
    } finally {
     setPending((p) => ({ ...p, [id]: undefined }));
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this event? This cannot be undone.")) return;
    setError("");
    setPending((p) => ({ ...p, [id]: "delete" }));
    // Optimistic UI: remove immediately
    setDeletedEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      const { error } = await supabase.rpc("admin_permanently_delete_event", { p_event_id: id });
     if (error) {
       console.error("admin_permanently_delete_event error:", error);
     }
      if (error?.message?.includes("not_eligible")) {
        throw new Error("This event cannot be permanently deleted yet (30-day rule).");
      }
      if (error?.message?.includes("forbidden")) {
        throw new Error("You do not have permission to perform this action.");
      }
      if (error?.message?.includes("function admin_permanently_delete_event")) {
        const fallback = await supabase
          .from("events")
          .update({ permanently_deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (fallback.error) throw fallback.error;
      } else if (error) {
        throw error;
      }
    } catch (e: any) {
     console.error("Permanent delete failed:", e);
      await refetchDeletedEvents();
      setError("Failed to permanently delete event: " + (e?.message || "Unknown error"));
    } finally {
      setPending((p) => ({ ...p, [id]: undefined }));
    }
  };

 // Small helper to re-fetch current list (used for rollback)
 async function refetchDeletedEvents() {
   const { data } = await supabase
     .from("events")
     .select("*")
     .not("deleted_at", "is", null)
     .is("permanently_deleted_at", null);
   setDeletedEvents(data || []);
 }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Deleted Events (Admin)</h1>
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {deletedEvents.length === 0 ? (
          <p>No deleted events.</p>
        ) : (
          <ul className="space-y-4">
            {deletedEvents.map((event) => {
              const deletedAt = event.deleted_at ? new Date(event.deleted_at) : null;
              const now = new Date();
              const daysSinceDeleted = deletedAt ? Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const daysLeft = 30 - daysSinceDeleted;

              return (
                <li key={event.id} className="bg-white shadow p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-700">
                      Deleted {daysSinceDeleted} day{daysSinceDeleted !== 1 ? "s" : ""} ago
                      {daysLeft > 0 ? (
                        <span className="ml-2 text-xs text-gray-500">
                          ({daysLeft} day{daysLeft !== 1 ? "s" : ""} until safe to delete)
                        </span>
                      ) : (
                        <span className="ml-2 text-xs text-green-600 font-semibold">Safe to permanently delete from website.</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(event.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={pending[event.id] === "restore"}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(event.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      disabled={daysLeft > 0 || pending[event.id] === "delete"}
                      title={daysLeft > 0 ? "Can only delete after 30 days" : ""}
                    >
                      Permanently Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
