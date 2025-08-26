import { Suspense } from 'react';
import EventsWithFilters from '@/components/EventsWithFilters';
import { supabase } from '@/lib/supabase';

async function getEvents() {
  try {
    const { data: events, error, status } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: true });

    if (error) {
      // print more diagnostic info — JSON.stringify may miss non-enumerable props so include name/message/status
      console.error('Supabase error:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        status,
        raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // dev-only: check whether env is present (don't log secrets in prod)
      if (process.env.NODE_ENV !== 'production') {
        console.log('NEXT_PUBLIC_SUPABASE_URL present?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY present?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      }

      return [];
    }

    return events || [];
  } catch (err) {
    console.error('Unexpected error fetching events:', err);
    return [];
  }
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
