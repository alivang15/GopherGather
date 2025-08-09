"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";

const categoryOptions = [
  "Academic",
  "Career",
  "Cultural",
  "Social",
  "Sports",
  "Workshop",
];

const audienceOptions = [
  "Open to all",
  "Undergraduate students",
  "Graduate students",
  "Faculty/Staff",
  "Alumni",
  "Invite Only",
];

export default function CreateEventPage() {
  const { user, loading } = useAuth();
  const userType = useUserType();
  console.log("DEBUG userType:", userType);
  const isAdmin = userType === "admin" || userType === "club_admin";
  const router = useRouter();

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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [myOrganizationId, setMyOrganizationId] = useState<string>("");
  useEffect(() => {
    if (userType === "admin") {
      supabase
        .from("clubs")
        .select("id, name")
        .then(({ data }) => setOrganizations(data ?? []));
    } else if (userType === "club_admin" && user) {
      // Fetch the club/organization for the current user
      supabase
        .from("club_admins")
        .select("club_id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.club_id) setMyOrganizationId(data.club_id);
        });
    }
  }, [userType, user]);

//   if (!loading && (!user || !isAdmin)) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <p>You do not have permission to access this page.</p>
//       </div>
//     );
//   }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const orgIdToUse = userType === "admin" ? selectedOrgId : myOrganizationId;

      if (!orgIdToUse) {
        setError("Please select an organization.");
        setSubmitting(false);
        return;
      }

      let uploadedImageUrl = "";
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `events/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        console.log("Uploading file:", imageFile, "to path:", filePath);

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Image upload failed:", uploadError);
          setError("Image upload failed: " + uploadError.message);
          setSubmitting(false);
          return;
        }
        // Get public URL
        const { data } = supabase.storage.from("event-images").getPublicUrl(filePath);
        uploadedImageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("events").insert([
        {
          title,
          description,
          date: date || null,
          start_time: startTime || null,
          end_time: endTime || null,
          location: location || null,
          category,
          audience: audience || null,
          post_url: postUrl || null,
          image_url: uploadedImageUrl || null,
          status: "approved",
          club_id: orgIdToUse,
          created_by: user?.id,
        },
      ]);

      if (error) {
        console.error("Error creating event:", error);
        setError("Failed to create event. Please try again.");
      } else {
        setSuccess(true);
        setTitle("");
        setDescription("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setLocation("");
        setCategory("");
        setAudience("");
        setPostUrl("");
        setImageFile(null);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Event Created!</h2>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white p-8 shadow border border-gray-200 rounded-lg">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Create Event</h1>
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7a0019]"
              >
                <option value="">Select a category</option>
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audience
              </label>
              <select
                value={audience}
                onChange={e => setAudience(e.target.value)}
                required
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7a0019]"
              >
                <option value="">Select an audience</option>
                {audienceOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Post URL
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          {userType === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full border-gray-300 rounded-md px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
