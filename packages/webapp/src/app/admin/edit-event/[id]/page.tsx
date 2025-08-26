"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUserType } from "@/hooks/useUserType";
import type { Event } from "@/types";
import { sanitizeInput } from "@/utils/sanitize";


export default function EditEventPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const router = useRouter();
    const userType = useUserType();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [event, setEvent] = useState<Event | null>(null);

    // Form fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [audience, setAudience] = useState("");
    const [postUrl, setPostUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        async function fetchEvent() {
            setLoading(true);
            const { data, error } = await supabase
                .from("events")
                .select("*")
                .eq("id", id)
                .single();
            if (error || !data) {
                setError("Event not found.");
                setLoading(false);
                return;
            }
            setEvent(data);
            setTitle(data.title || "");
            setDescription(data.description || "");
            setDate(data.date || "");
            setStartTime(data.start_time || "");
            setEndTime(data.end_time || "");
            setLocation(data.location || "");
            setCategory(data.category || "");
            setAudience(data.audience || "");
            setPostUrl(data.post_url || "");
            setImageFile(null);
            setLoading(false);
        }
        fetchEvent();
    }, [id]);

    // Handle update
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        let uploadedImageUrl = event?.image_url || "";

        if (imageFile) {
            const allowedTypes = [
                "image/png",
                "image/jpeg",
                "image/jpg",
            ];
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

            if (!allowedTypes.includes(imageFile.type)) {
                setError("Invalid file type. Please upload a PNG, JPEG, or JPG image.");
                setSubmitting(false);
                return;
            }

            if (imageFile.size > MAX_FILE_SIZE) {
                setError("File size exceeds the 5MB limit.");
                setSubmitting(false);
                return;
            }

            const fileExt = imageFile.name.split('.').pop();
            const filePath = `events/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("event-images")
                .upload(filePath, imageFile, { upsert: true });
            if (uploadError) {
                setError("Image upload failed: " + uploadError.message);
                setSubmitting(false);
                return;
            }
            const { data } = supabase.storage.from("event-images").getPublicUrl(filePath);
            uploadedImageUrl = data.publicUrl;
        }

        const sanitized = {
            title: sanitizeInput(title),
            description: sanitizeInput(description),
            location: sanitizeInput(location),
            category: sanitizeInput(category),
            audience: sanitizeInput(audience),
            postUrl: sanitizeInput(postUrl),
        };

        if (
            sanitized.title !== title ||
            sanitized.description !== description ||
            sanitized.location !== location ||
            sanitized.category !== category ||
            sanitized.audience !== audience ||
            sanitized.postUrl !== postUrl
        ) {
            setError("Invalid input detected.");
            setSubmitting(false);
            return;
        }

        const { error: updateError } = await supabase
            .from("events")
            .update({
                title: sanitized.title,
                description: sanitized.description,
                date: date || null,
                start_time: startTime || null,
                end_time: endTime || null,
                location: sanitized.location || null,
                category: sanitized.category,
                audience: sanitized.audience || null,
                post_url: sanitized.postUrl || null,
                image_url: uploadedImageUrl || null,
            })
            .eq("id", id);

        if (updateError) {
            setError("Failed to update event. " + updateError.message);
        } else {
            router.push(`/events/${id}`);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-2xl bg-white p-8 shadow border border-gray-200 rounded-lg">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Event</h1>
                {error && <p className="mb-4 text-red-600">{error}</p>}
                <form className="space-y-4" onSubmit={handleUpdate}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                required
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                            <input
                                type="text"
                                value={audience}
                                onChange={e => setAudience(e.target.value)}
                                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Post URL</label>
                        <input
                            type="url"
                            value={postUrl}
                            onChange={e => setPostUrl(e.target.value)}
                            className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => setImageFile(e.target.files?.[0] || null)}
                            className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Upload a new image to replace the current one.
                        </p>
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? "Updating..." : "Update Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
