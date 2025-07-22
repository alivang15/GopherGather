import { Suspense } from 'react';
import EventsWithFilters from '@/components/EventsWithFilters';
import { supabase } from '@/lib/supabase';

async function getEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'approved')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return events || [];
}

// Wrapper component to handle search params
function EventsWrapper({ events }: { events: any[] }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    }>
      <EventsWithFilters allEvents={events} />
    </Suspense>
  );
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-white">
      <EventsWrapper events={events} />
    </div>
  );
}
