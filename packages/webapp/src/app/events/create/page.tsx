"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { sanitizeInput } from "@/utils/sanitize";

export default function CreateEventPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [userType, setUserType] = useState<string | null>(null);
    const [clubId, setClubId] = useState<string | null>(null);
    const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
    
    // Fetch user_type from public.users
    useEffect(() => {

        const fetchUserType = async () => {
            if (user?.id) {
                const { data, error } = await supabase
                    .from('users')
                    .select('user_type')
                    .eq('id', user.id)
                    .single();
                setUserType(data?.user_type ?? null);
                // setClubId(data?.club_id ?? null);
            } else {
                if (process.env.NODE_ENV !== 'production') {
                    console.log("No user.id yet", user);
                }
            }
        };
        fetchUserType();
    }, [user]);

    // Fetch clubs if user is admin
    useEffect(() => {
        const fetchClubs = async () => {
            if (userType === "admin") {
                const { data } = await supabase
                    .from('clubs')
                    .select('id, name');
                setClubs(data ?? []);
            }
        };
        fetchClubs();
    }, [userType]);

    // Optionally: Only allow admins/club_admins
    // You may want to fetch userType from your context or DB
    // if (userType !== "admin" && userType !== "club_admin") return <div>Not authorized</div>;

    const [form, setForm] = useState({
        title: "",
        date: "",
        start_time: "",
        end_time: "",
        location: "",
        category: "",
        description: "",
        club_id: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!form.title || !form.date || !form.category) {
            setError("Title, date, and category are required.");
            setLoading(false);
            return;
        }

        if (userType !== "club_admin" && userType !== "admin") {
            setError("You are not authorized to create events.");
            setLoading(false);
            return;
        }

        const eventClubId = userType === "admin" ? (form.club_id || null) : clubId;

        if (!eventClubId) {
            setError("Please select a club for this event.");
            setLoading(false);
            return;
        }

        const sanitized = {
            title: sanitizeInput(form.title),
            date: form.date,
            start_time: form.start_time,
            end_time: form.end_time,
            location: sanitizeInput(form.location),
            category: sanitizeInput(form.category),
            description: sanitizeInput(form.description),
        };

        if (
            sanitized.title !== form.title ||
            sanitized.location !== form.location ||
            sanitized.category !== form.category ||
            sanitized.description !== form.description
        ) {
            setError("Invalid input detected.");
            setLoading(false);
            return;
        }

        const response = await fetch("/api/events/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": user?.id || "",
            },
            body: JSON.stringify({
                ...sanitized,
                status: "approved",
                created_by: user?.id,
                club_id: eventClubId,
            }),
        });

        if (!response.ok) {
            const { error } = await response.json();
            setError(error);
        } else {
            router.push("/");
        }
        setLoading(false);
    };

    if (userType === null) {
        return <div className="text-center mt-10">Loading...</div>;
    }
    if (userType !== "club_admin" && userType !== "admin") {
        return (
            <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow text-red-600">
                You are not authorized to create events.
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-2xl text-gray-700 font-bold mb-6">Create Event</h1>
            <form className="space-y-4 text-gray-400" onSubmit={handleSubmit}>
                <input name="title" placeholder="Title" className="w-full border p-2 rounded" value={form.title} onChange={handleChange} required />
                <input name="date" type="date" className="w-full border p-2 rounded" value={form.date} onChange={handleChange} required />
                <input name="start_time" type="time" className="w-full border p-2 rounded" value={form.start_time} onChange={handleChange} />
                <input name="end_time" type="time" className="w-full border p-2 rounded" value={form.end_time} onChange={handleChange} />
                <input name="location" placeholder="Location" className="w-full border p-2 rounded" value={form.location} onChange={handleChange} />
                <input name="category" placeholder="Category" className="w-full border p-2 rounded" value={form.category} onChange={handleChange} required />
                <textarea name="description" placeholder="Description" className="w-full border p-2 rounded" value={form.description} onChange={handleChange} />
                {userType === "admin" && (
                    <select
                        name="club_id"
                        className="w-full border p-2 rounded"
                        value={form.club_id || ""}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Campus Event (not tied to a club)</option>
                        {clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                                {club.name}
                            </option>
                        ))}
                    </select>
                )}
                {error && <div className="text-red-600">{error}</div>}
                <button type="submit" className="w-full bg-[#7a0019] text-white py-2 rounded" disabled={loading}>
                    {loading ? "Creating..." : "Create Event"}
                </button>
            </form>
        </div>
    );
}
