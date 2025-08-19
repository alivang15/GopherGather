# GopherGatherings Campus Events Platform

A modern event discovery platform for the University of Minnesota community.

## Features

- 🎯 Real-time Events and filtering by category
- 🧭 Smart Filters: Academic, Social, Sports, Cultural, Career, Workshop
- 👤 Profile: account details and preferences (notifications coming soon)
- 🏆 Leaderboard: community stats, Top Event Goers, Trending Events, Popular Categories
- 📅 Events This Week: quick snapshot of what’s happening now
- 🖼️ Avatars: user profile images stored in Supabase Storage (public `avatars` bucket)
- 📱 Responsive and ♿ Accessible UI

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript
- Styling: Tailwind CSS 4
- Database/Auth/Storage: Supabase
- Deployment: Vercel

## Getting Started

1) Clone
```bash
git clone https://github.com/your-username/umn-events.git
cd umn-events
```

2) Install dependencies
```bash
cd packages/webapp
npm install
```

3) Environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# Required:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4) Supabase setup (database + storage)
- Create a public storage bucket named `avatars`. Avatars are stored under `users/<user-id>/...`.
- Ensure tables exist: `users`, `events`, `rsvps`.
- Because RLS restricts broad SELECTs, the app uses SECURITY DEFINER RPCs for aggregates:
  - public.get_total_students()
  - public.get_events_in_range(start_date date, end_date date)
  - public.get_top_event_goers(limit_count int)
  - public.get_trending_events(limit_count int)
  - public.get_popular_categories(limit_count int)

Grant EXECUTE on each RPC to role `authenticated`. See code where these are used in:
- [packages/webapp/src/components/profile/LeaderboardSection.tsx](packages/webapp/src/components/profile/LeaderboardSection.tsx)

5) Run the web app
```bash
npm run dev
# open http://localhost:3000
```

## Project Structure

```
packages/webapp/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── profile/              # Profile pages (Account, Profile, Leaderboard, Notifications)
│   │   └── admin/create-event/   # Admin: create event page
│   ├── components/               # UI components
│   │   └── profile/              # Profile-related components
│   ├── hooks/                    # Reusable hooks
│   ├── lib/                      # Supabase client and utilities
│   └── types/                    # TypeScript type definitions
├── public/                       # Static assets
└── package.json
```

## Key Pages and Components

- Pages
  - [Profile](packages/webapp/src/app/profile/page.tsx): sidebar navigation for Account, Profile, Leaderboard, Notifications
  - [Create Event](packages/webapp/src/app/admin/create-event/page.tsx): admin utility to add events
- Profile components
  - [AccountSection](packages/webapp/src/components/profile/AccountSection.tsx)
  - [ProfileSection](packages/webapp/src/components/profile/ProfileSection.tsx) — Achievement Highlights currently commented out
  - [LeaderboardSection](packages/webapp/src/components/profile/LeaderboardSection.tsx)
  - [NotificationsSection](packages/webapp/src/components/profile/NotificationsSection.tsx) — Coming soon
- Events
  - [EventsWithFilters](packages/webapp/src/components/EventsWithFilters.tsx)
  - [EventCard](packages/webapp/src/components/EventCard.tsx)


## License

MIT License — see LICENSE
