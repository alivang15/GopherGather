"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EventCard from './EventCard';
import FilterNavigation from './FilterNavigation';
import type { Event } from "@/types";

interface EventsWithFiltersProps {
  allEvents: Event[];
}

export default function EventsWithFilters({ allEvents }: EventsWithFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize with URL params or default to 'All Events'
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams?.get('category') || 'All Events';
  });
  
  // Add state to track how many past events to show
  const [shownPastEvents, setShownPastEvents] = useState(6);
  
  // Update URL when category changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (selectedCategory === 'All Events') {
      params.delete('category');
    } else {
      params.set('category', selectedCategory);
    }
    
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [selectedCategory, searchParams, router]);

  // FIXED: Filter events based on category - corrected logic
  const filteredEvents = useMemo(() => {
    let events = allEvents;

    // Exclude soft-deleted events
    events = events.filter(event => !event.deleted_at);

    if (selectedCategory === 'All Events') {
      return events;
    }

    return events.filter(event => event.category === selectedCategory);
  }, [allEvents, selectedCategory]);

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // FIXED EVENT CATEGORIZATION LOGIC
  const categorizeEvents = (events: Event[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = now.getDate().toString().padStart(2, '0');
    const currentDate = `${currentYear}-${currentMonth}-${currentDay}`;
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}:00`;

    // Helper function to determine if an event is past
    const isEventPast = (event: Event): boolean => {
      if (!event.date) return false;
      const now = new Date();

      // Build event end datetime
      let endTime = "23:59:59";
      if (event.end_time) {
        endTime = event.end_time.length === 5 ? `${event.end_time}:00` : event.end_time;
      } else if (event.start_time) {
        // Add 2 hours to start_time
        const [h, m] = event.start_time.split(":").map(Number);
        const endH = (h + 2) % 24;
        endTime = `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
      }
      // Combine date and time
      const eventEnd = new Date(`${event.date}T${endTime}`);

      return eventEnd < now;
    };

    // Helper function to determine if an event is currently happening
    const isEventCurrent = (event: Event): boolean => {
      if (!event.date || event.date !== currentDate) return false;
      if (!event.start_time) return true; // No time specified, assume current
      
      const eventStart = event.start_time.includes(':') 
        ? (event.start_time.split(':').length === 2 ? `${event.start_time}:00` : event.start_time)
        : event.start_time;
      
      if (event.end_time) {
        const eventEnd = event.end_time.includes(':') 
          ? (event.end_time.split(':').length === 2 ? `${event.end_time}:00` : event.end_time)
          : event.end_time;
        return eventStart <= currentTime && eventEnd >= currentTime;
      } else {
        // No end time - consider current for 2 hours after start
        const startHour = parseInt(eventStart.split(':')[0]);
        const startMinute = parseInt(eventStart.split(':')[1]);
        
        const endHour = startHour + 2;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        
        return eventStart <= currentTime && endTime >= currentTime;
      }
    };

    // Categorize events
    const pastEvents = events.filter(event => isEventPast(event));
    const currentEvents = events.filter(event => !isEventPast(event) && isEventCurrent(event));
    const upcomingEvents = events.filter(event => !isEventPast(event) && !isEventCurrent(event));

    // Sort past events newest first by event end datetime
    const normalizeEndTime = (ev: Event) => {
      let endTime = "23:59:59";
      if (ev.end_time) {
        endTime = ev.end_time.length === 5 ? `${ev.end_time}:00` : ev.end_time;
      } else if (ev.start_time) {
        const [h, m] = ev.start_time.split(":").map(Number);
        const endH = (h + 2) % 24;
        endTime = `${endH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
      }
      return `${ev.date}T${endTime}`;
    };

    pastEvents.sort((a, b) => {
      const aT = new Date(normalizeEndTime(a)).getTime();
      const bT = new Date(normalizeEndTime(b)).getTime();
      return bT - aT; // newest first
    });
 
     return { currentEvents, upcomingEvents, pastEvents };
   };

  const { currentEvents, upcomingEvents, pastEvents } = categorizeEvents(filteredEvents);

  if (process.env.NODE_ENV !== 'production') {
    console.log('Event categorization:', {
      filtered: filteredEvents.length,
      current: currentEvents.length,
      upcoming: upcomingEvents.length,
      past: pastEvents.length
    });
  }

  // Function to load more past events
  const loadMorePastEvents = () => {
    // Increase by 6 more events, or show all remaining if less than 6 remain
    setShownPastEvents(prev => 
      Math.min(prev + 6, pastEvents.length)
    );
  };

  return (
    <>
      {/* Filter Navigation */}
      <FilterNavigation
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Found</h2>
            <p className="text-gray-600">
              {selectedCategory === 'All Events' 
                ? "There are no events available at the moment." 
                : `No events found in the ${selectedCategory} category.`}
            </p>
            {selectedCategory !== 'All Events' && (
              <button
                onClick={() => handleCategoryChange('All Events')}
                className="mt-4 px-6 py-3 bg-[#7a0019] text-white rounded-lg hover:bg-red-800 transition-colors"
              >
                View All Events
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Current Events Section */}
            {currentEvents.length > 0 && (
              <div className="mb-12">
                <h2 className="bebas-neue-regular text-3xl text-[#7a0019] mb-6 text-center flex items-center justify-center">
                  🔴 HAPPENING NOW
                </h2>
                {/* FIXED: Center and spread out all happening events */}
                <div className={`
                  grid gap-6 justify-items-center
                  ${currentEvents.length === 1 
                    ? 'grid-cols-1 max-w-md mx-auto' 
                    : currentEvents.length === 2 
                      ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }
                `}>
                  {currentEvents.map((event) => (
                    <div key={event.id} className="rounded-lg w-full max-w-sm">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
              <div className="mb-12">
                <h2 className="bebas-neue-regular text-4xl text-[#7a0019] mb-6 text-center flex items-center justify-center">
                  🎯 NEXT UP
                </h2>
                {currentEvents.length === 0 ? (
                  <>
                    {/* Featured first upcoming when there are no current events */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <div className="md:col-start-2 lg:col-start-2">
                        <EventCard event={upcomingEvents[0]} />
                      </div>
                    </div>
                    {upcomingEvents.length > 1 && (
                      <>
                        <h3 className="bebas-neue-regular text-xl text-[#7a0019] mb-6 text-center">
                          All Upcoming Events
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {upcomingEvents.slice(1).map((event) => (
                            <EventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  // When there are current events, just show all upcoming in a grid
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Past Events Section */}
            {pastEvents.length > 0 && (
              <div id="past-events" className="mb-12 scroll-mt-32">
                <h2 className="bebas-neue-regular text-3xl text-[#7a0019] mb-6 text-center">
                  PAST EVENTS
                </h2>
                <div className="bg-gray-50 rounded-lg shadow-sm p-6 mb-6">
                  <p className="text-center text-gray-600">
                    Browse events that have already happened. Great for seeing what you missed or getting ideas for future events!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.slice(0, shownPastEvents).map((event) => (
                    <div key={event.id} className="opacity-75 hover:opacity-100 transition-opacity">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
                
                {shownPastEvents < pastEvents.length && (
                  <div className="text-center mt-8">
                    <button 
                      onClick={loadMorePastEvents}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      Load More Past Events ({pastEvents.length - shownPastEvents} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
