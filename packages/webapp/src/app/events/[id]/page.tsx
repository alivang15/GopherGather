"use client";
import { useUserType } from "@/hooks/useUserType";

import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Event } from "@/types";
import { sanitizeInput } from "@/utils/sanitize";

// Helper functions
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(':');
  const hour24 = parseInt(hours);
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes} ${period}`;
}
export default function EventDetailPage() {
  const userType = useUserType();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data: eventData, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .single();

          if (fetchError) {
            console.error('Error fetching event:', fetchError);
            setError(true);
          } else {
            const sanitized = {
              ...eventData,
              title: sanitizeInput(eventData.title || ""),
              description: sanitizeInput(eventData.description || ""),
              original_text: sanitizeInput(eventData.original_text || ""),
              location: sanitizeInput(eventData.location || ""),
              category: sanitizeInput(eventData.category || ""),
              audience: sanitizeInput(eventData.audience || ""),
              post_url: sanitizeInput(eventData.post_url || ""),
            } as Event;
            setEvent(sanitized);
          }
      } catch (err) {
        console.error('Error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchEvent();
  }, [id]);

  // (Optional old behavior) auto-open modal after auth redirect
  const [vibeCheckOpen, setVibeCheckOpen] = useState(false);

  useEffect(() => {
    const shouldOpenVibeCheck = searchParams?.get('open_vibe_check') === 'true';
    const eventIdFromUrl = searchParams?.get('event_id');
    if (shouldOpenVibeCheck && eventIdFromUrl === id) setVibeCheckOpen(true);
  }, [searchParams, id]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title ?? 'Event',
          text: ((event?.description ?? event?.original_text) ?? '').substring(0, 100) + '...',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Event link copied to clipboard!');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  const handleSoftDelete = async () => {
    if (!event) {
      alert("No event selected.");
      return;
    }

    if (!confirm("Are you sure you want to delete this event? You can restore it within 30 days.")) return;
    const { error } = await supabase
      .from('events')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', event.id);
    if (error) {
      alert("Failed to delete event: " + error.message);
    } else {
      window.location.reload();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-8">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = event.date ? new Date(event.date) > new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{sanitizeInput(event.title ?? "")}</h1>
          {isUpcoming && (
            <span className="inline-block bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full mt-2">
              Upcoming Event
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Hero Image */}
          {event.image_url && (
            <div className="relative h-64 md:h-96 w-full">
              <Image
                src={event.image_url}
                alt={sanitizeInput(event.title ?? "")}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Event Details Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Event Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                  <div className="space-y-3">
                    {/* Date */}
                    {event.date && (
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{formatDate(event.date ?? "")}</span>
                      </div>
                    )}

                    {/* Time */}
                    {event.start_time && (
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          {formatTime(event.start_time ?? "")}
                          {event.end_time && ` - ${formatTime(event.end_time ?? "")}`}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">{sanitizeInput(event.location ?? "")}</span>
                      </div>
                    )}

                    {/* Audience */}
                    {event.audience && (
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">{sanitizeInput(event.audience)}</span>
                      </div>
                    )}

                    {/* Category */}
                    <div className="flex items-center">
                      <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {sanitizeInput(event.category ?? "")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Take Action</h2>
                  <div className="space-y-3">
                    {/* RSVP/Event Link */}
                    {event.post_url && event.post_url.startsWith('https://') && (
                      <a
                        href={event.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full bg-[#7a0019] hover:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        {event.post_url.includes('instagram.com') && (
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        )}
                        {event.post_url.includes('facebook.com') && (
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        View Event Details & RSVP
                      </a>
                    )}

                    {/* Vibe Check Button - NOW FUNCTIONAL! */}
                    <Link
                      href={`/events/${id}/vibe-check`}
                      className="flex items-center justify-center w-full bg-[#7a0019] hover:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      ✨ Get Vibe Check ✨
                    </Link>

                    {/* Share Button */}
                    <button 
                      onClick={handleShare}
                      className="flex items-center justify-center w-full bg-[#7a0019] hover:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 cursor-pointer"
                    >
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                       </svg>
                       Share Event
                    </button>
                    {userType === "admin" && (
                      <div className="flex justify-center gap-4 mt-8">
                        <Link
                          href={`/admin/edit-event/${event.id}`}
                          className="w-40 text-center bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                        >
                          Edit Event
                        </Link>
                        <button
                          onClick={handleSoftDelete}
                          className="w-40 text-center bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-colors duration-200"
                        >
                          Delete Event
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {(event.description || event.original_text) && (
              <div className="border-t pt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sanitizeInput((event.description ?? event.original_text) ?? "")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal removed in favor of dedicated page */}
    </div>
  );
}
