"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import VibeCheckPanel from "@/components/vibe/VibeCheckPanel";

export default function VibeCheckPage() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      if (!eventId || eventId === "undefined") return;
      const { data } = await supabase.from("events").select("title").eq("id", eventId).single();
      setTitle(data?.title ?? "");
    };
    load();
  }, [eventId]);

  if (!eventId || eventId === "undefined") return <div className="p-6">Invalid event.</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <VibeCheckPanel eventId={eventId} eventTitle={title} />
    </main>
  );
}
