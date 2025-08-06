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
  event: Event;
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
