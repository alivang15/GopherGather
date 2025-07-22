"use client";

import Image from 'next/image';
import Link from 'next/link';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    original_text?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    category: string;
    audience?: string;
    image_url?: string;
    status: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
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
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}:00`;
    
    // If event date is in the past
    if (event.date < currentDate) return 'past';
    
    // If event date is in the future
    if (event.date > currentDate) return 'upcoming';
    
    // If event is today, check time
    if (event.date === currentDate) {
      if (!event.start_time) return 'current'; // No time specified
      
      const eventStart = event.start_time.includes(':') 
        ? (event.start_time.split(':').length === 2 ? `${event.start_time}:00` : event.start_time)
        : event.start_time;
      
      if (event.end_time) {
        // Has end time - check if event has ended
        const eventEnd = event.end_time.includes(':') 
          ? (event.end_time.split(':').length === 2 ? `${event.end_time}:00` : event.end_time)
          : event.end_time;
        
        return (eventStart <= currentTime && eventEnd >= currentTime) ? 'current' : 
               (eventEnd < currentTime) ? 'past' : 'upcoming';
      } else {
        // No end time - consider current for 2 hours after start
        const startHour = parseInt(eventStart.split(':')[0]);
        const startMinute = parseInt(eventStart.split(':')[1]);
        const endHour = startHour + 2;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        
        return (eventStart <= currentTime && endTime >= currentTime) ? 'current' : 
               (endTime < currentTime) ? 'past' : 'upcoming';
      }
    }
    
    return 'upcoming';
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
  const displayLocation = event.location || 'Location TBA';
  const displayAudience = event.audience || 'Open to All';

  // ONE LINE DESCRIPTION - Fixed character limit for consistency
  const getDisplayDescription = () => {
    if (!event.original_text) return 'Event description coming soon...';
    
    // Clean the text - remove line breaks and extra spaces
    const cleanedText = event.original_text
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit to exactly 80 characters for one line consistency
    if (cleanedText.length > 80) {
      return cleanedText.substring(0, 77) + '...';
    }
    
    return cleanedText;
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

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <div className={`
        bg-white rounded-lg shadow-md overflow-hidden 
        transform transition-all duration-300 ease-out
        group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-2
        ${eventStatus === 'current' ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
        cursor-pointer
      `}>
        {/* Hero Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={event.title || 'Event image'}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            onError={(e) => {
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

        {/* Content with hover animations */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 transition-colors duration-200 group-hover:text-blue-600">
              {event.title}
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
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{displayDate}</span>
            </div>

            {/* Time - Always shown */}
            <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{displayTime}</span>
            </div>

            {/* Location - Always shown */}
            <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{displayLocation}</span>
            </div>

            {/* Audience - Always shown */}
            <div className="flex items-center transition-all duration-200 group-hover:text-gray-800 group-hover:translate-x-1">
              <svg className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>{displayAudience}</span>
            </div>
          </div>

          {/* Category Badge and Read More */}
          <div className="flex justify-between items-center mt-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded transition-all duration-200 group-hover:bg-blue-200 group-hover:scale-105">
              {event.category}
            </span>
            <span className="text-xs text-gray-500 transition-all duration-200 group-hover:text-blue-600 group-hover:translate-x-1">
              Click for details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
