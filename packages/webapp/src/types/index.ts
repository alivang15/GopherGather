/**
 * Shared TypeScript interfaces for the UMN Events platform
 */

export interface Event {
  id: string;
  title: string;
  deleted_at?: string;
  original_text?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  category: string;
  audience?: string;
  post_url?: string;
  image_url?: string;
  status: string;
  created_at: string;
}

export interface EventCardProps {
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
    club_id?: string; // Added club_id for fetching club name
  };
}

export interface FilterNavigationProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export interface EventsWithFiltersProps {
  allEvents: Event[];
}

export type EventStatus = 'current' | 'upcoming' | 'past';

export type EventCategory = 
  | 'All Events'
  | 'Academic'
  | 'Career'
  | 'Cultural'
  | 'Social'
  | 'Sports'
  | 'Workshop';

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    // add other metadata fields as needed
  };
  // add other fields as needed (e.g., username, points, etc.)
}

export interface ProfileOverview {
  points: number;
  eventsAttended: number;
  activeRsvps: number;
  achievements: number;
  photosShared: number;
  dayStreak: number;
  favorites: { category: string; attended: number }[];
  campusImpact: { vibe_checks: number };
  eventsAttendedThisWeek?: number;
}

export interface AccountSectionProps {
  user: User;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export interface WeekEvent {
  id: string;
  title: string;
  date: string;
  going_count?: number | null;
}

export interface TopEvent {
  id: string;
  title: string;
  category?: string | null;
  rsvps: number;
}

export interface TopGoer {
  user_id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  going_count: number;
  avatar_url?: string | null;
}

export interface PopularCategory {
  category: string;
  count: number;
  percentage: number;
}
