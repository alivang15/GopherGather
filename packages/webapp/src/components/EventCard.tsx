"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef } from "react";
import { supabase } from '@/lib/supabase';
import { EventCardProps } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { to24h, addHours } from '@/lib/time';
import { sanitizeInput } from "@/utils/sanitize";

export default function EventCard({ event }: EventCardProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);
  const [goingCount, setGoingCount] = useState<number>(0);
  const [interestedCount, setInterestedCount] = useState<number>(0);
  const { user } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ message: "", visible: false }), 2500);
  };

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (event?.club_id) {
      supabase
        .from('clubs')
        .select('name')
        .eq('id', event.club_id)
        .single()
        .then(({ data }) => setClubName(data?.name ?? null));
    }
  }, [event?.club_id]);

  useEffect(() => {
    const fetchRsvpCounts = async () => {
      const { data: goingData } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', event.id)
        .eq('status', 'going');

      const { data: interestedData } = await supabase
        .from('rsvps')
        .select('id')
        .eq('event_id', event.id)
        .eq('status', 'interested');

      setGoingCount(goingData?.length ?? 0);
      setInterestedCount(interestedData?.length ?? 0);
    };

    fetchRsvpCounts();
  }, [event.id]);

  /**
   * Format date string to readable format
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBA';
    // const [year, month, day] = dateStr.split('-').map(Number);
    // const date = new Date(year, month - 1, day);
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  /**
   * Format time string to 12-hour format
   */
  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Time TBA';
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${period}`;
  };

  /**
   * Determine event status based on current date/time
   * Returns: 'current' | 'upcoming' | 'past'
   */
  const getEventStatus = () => {
    if (!event.date) return 'upcoming';
    if (!now) return 'upcoming';

    const start = to24h(event.start_time);
    const end = event.end_time ? to24h(event.end_time) : (start ? addHours(start, 2) : null);

    // No times: day-only
    if (!start && !end) {
      const today = now.toISOString().slice(0, 10);
      if (event.date < today) return 'past';
      if (event.date > today) return 'upcoming';
      return 'current';
    }

    const startDT = start ? new Date(`${event.date}T${start}`) : new Date(`${event.date}T00:00:00`);
    const endDT = end ? new Date(`${event.date}T${end}`) : new Date(`${event.date}T23:59:59`);

    if (endDT < now) return 'past';
    if (startDT > now) return 'upcoming';
    return 'current';
  };

  const eventStatus = getEventStatus();

  // Fixed image handling with default values
  const imageUrl = event.image_url || '/GG-defaultImage.png';
  const isDefaultImage = !event.image_url;

  // Default values for consistent display
  const displayDate = event.date ? formatDate(event.date) : 'Date TBA';
  const displayTime = event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ''}`
    : 'Time TBA';
  const displayLocation = sanitizeInput(event.location || 'Location TBA');
  const displayAudience = sanitizeInput(event.audience || 'Open to All');
  const sanitizedTitle = sanitizeInput(event.title);
  const sanitizedCategory = sanitizeInput(event.category);
  const sanitizedClubName = sanitizeInput(clubName || "");

  // ONE-LINE DESCRIPTION
  const getDisplayDescription = () => {
    const rawText = event.description || event.original_text;
    if (!rawText) return "Event description coming soon...";

    const cleaned = sanitizeInput(rawText).replace(/\s+/g, " ").trim();
    return cleaned.length > 80 ? cleaned.slice(0, 77) + "..." : cleaned;
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = () => {
    switch (eventStatus) {
      case 'current':
        return (
          <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full animate-pulse">
            🔴 Happening Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
            Upcoming
          </span>
        );
      case 'past':
        return (
          <span className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">
            Past Event
          </span>
        );
      default:
        return null;
    }
  };

  const refreshCounts = async () => {
    const { count: going } = await supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'going');
    const { count: interested } = await supabase
      .from('rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'interested');
    setGoingCount(going ?? 0);
    setInterestedCount(interested ?? 0);
  };

  const handleRsvp = async (status: 'going' | 'interested') => {
    if (!user) {
      alert("Please sign in to RSVP");
      return;
    }

    // Find existing RSVP by this user for this event
    const { data: existing, error: fetchErr } = await supabase
      .from('rsvps')
      .select('id,status')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .maybeSingle();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      console.error(fetchErr);
      showToast('Failed to update RSVP. Please try again.');
      return;
    }

    let error: any = null;

    if (!existing) {
      // No RSVP yet -> insert
      ({ error } = await supabase.from('rsvps').insert([
        { user_id: user.id, event_id: event.id, status }
      ]));
      if (!error) showToast(`Marked as "${status.charAt(0).toUpperCase() + status.slice(1)}"!`);
    } else if (existing.status === status) {
      // Same status clicked again -> undo (delete)
      ({ error } = await supabase.from('rsvps').delete().eq('id', existing.id));
      if (!error) showToast("Cancelled RSVP successfully");
    } else {
      // Different status -> update
      ({ error } = await supabase.from('rsvps').update({ status }).eq('id', existing.id));
      if (!error) showToast(`Chaged RSVP to "${status.charAt(0).toUpperCase() + status.slice(1)}"`);
    }

    if (error) {
      console.error(error);
      showToast('Failed to update RSVP. Please try again.');
      return;
    }

    await refreshCounts();
  };

  return (
    <div
      className={`
        group
        bg-white rounded-lg shadow-md overflow-hidden 
        transform transition-all duration-300 ease-out
        hover:shadow-xl hover:scale-105 hover:-translate-y-2
        ${eventStatus === 'current' ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
      `}
    >
      {/* Hero Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={sanitizedTitle || 'Event image'}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
          onError={() => {
            console.error('Image failed to load:', imageUrl);
          }}
        />
        
        {/* GOPHER EVENT badge - in top-right corner */}
        {isDefaultImage && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-xs bg-white/90 text-gray-700 px-2 py-1 rounded shadow">
              GOPHER EVENT
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 transition-colors duration-200 group-hover:text-[]">
            {sanitizedTitle}
          </h3>
          <div className="transform transition-all duration-200 group-hover:scale-110 ml-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Description - EXACTLY ONE LINE */}
        <div className="mb-4 h-5">
          <p className="text-sm text-gray-600 leading-relaxed truncate">
            {getDisplayDescription()}
          </p>
        </div>

        {/* Event Details - Always consistent */}
        <div className="space-y-2 text-sm text-gray-600">
          {/* Date - Always shown */}
          <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{displayDate}</span>
          </div>

          {/* Time - Always shown */}
          <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{displayTime}</span>
          </div>

          {/* Location - Always shown */}
          <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
            <svg className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{displayLocation}</span>
          </div>

          {/* Audience - Always shown */}
          <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
            <svg
              className="w-5 h-5 mr-2 text-gray-600 transition-transform duration-200 group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="flex items-center gap-2 text-gray-700 text-sm">
              {displayAudience}
            </span>
          </div>
        </div>
        {/* Club Name */}
        {sanitizedClubName && (
          <div className="flex items-center gap-2 text-gray-700 mt-3 transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
            <svg
              className="w-5 h-5 text-gray-600 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 48 48"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Club/group icon */}
              <circle cx="14" cy="20" r="4" />
              <circle cx="34" cy="20" r="4" />
              <circle cx="24" cy="12" r="4" />
              <rect x="8" y="28" width="32" height="8" rx="2" />
              <circle cx="24" cy="24" r="4" />
              <path d="M8 36l-4 6h40l-4-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium">{sanitizedClubName}</span>
          </div>
        )}

        {/* Category Badge and Read More */}
        <div className="flex justify-between items-center mt-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded transition-all duration-200 group-hover:bg-blue-200 group-hover:scale-105">
            {sanitizedCategory}
          </span>
          {/* Only this triggers navigation */}
          <span
            className="text-xs text-gray-500 transition-all duration-200 group-hover:text-blue-600 group-hover:translate-x-1 cursor-pointer"
            onClick={() => router.push(`/events/${event.id}`)}
          >
            Click for details →
          </span>
        </div>

        {/* RSVP Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            className="bg-[#7a0019] text-white px-6 py-2 rounded font-semibold hover:bg-red-800 transition cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              handleRsvp('going');
            }}
          >
            Going
          </button>
          <button
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-300 transition cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              handleRsvp('interested');
            }}
          >
            Interested
          </button>
        </div>

        {/* RSVP Count */}
        <div className="mt-2">
          <span className="text-gray-700">
            {goingCount} going · {interestedCount} interested
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  );
}
