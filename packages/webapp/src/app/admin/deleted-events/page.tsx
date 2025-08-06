"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types";


export default function DeletedEventsPage() {
  const [deletedEvents, setDeletedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);
// .eq("permanently_deleted_at", null); up there
  const handleRestore = async (id: string) => {
    setError("");
    const { error } = await supabase
        .from('events')
        .update({ deleted_at: null })
        .eq('id', id);
    if (error) {
        setError("Failed to restore event: " + error.message);
        return;
    }
    setDeletedEvents(deletedEvents.filter(e => e.id !== id));
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("Permanently delete this event? This cannot be undone.")) return;
    setError("");
    const { error } = await supabase
        .from("events")
        .update({ permanently_deleted_at: new Date().toISOString() })
        .eq('id', id);  
    if (error) {
        setError("Failed to permanently delete event: " + error.message);
        return;
    }
    setDeletedEvents(deletedEvents.filter(e => e.id !== id));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Deleted Events (Admin)</h1>
        {deletedEvents.length === 0 ? (
          <p>No deleted events.</p>
        ) : (
          <ul className="space-y-4">
            {deletedEvents.map(event => {
              // Calculate days since deleted
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
                        <span className="ml-2 text-xs text-green-600 font-semibold">
                          Safe to permanently delete from website.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(event.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(event.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      disabled={daysLeft > 0}
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
