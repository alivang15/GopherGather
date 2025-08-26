# GopherGather Campus Events Platform

A modern event discovery platform for the University of Minnesota community.

## Features

- 🎯 **Real-time Events**: See what's happening now on campus
- 📅 **Event Categories**: Filter by Academic, Social, Sports, Cultural, Career, and Workshop events
- 🔍 **Smart Filtering**: Easily find events that match your interests
- 📱 **Responsive Design**: Works perfectly on all devices
- ♿ **Accessible**: Built with accessibility in mind

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/alivang15/GopherGather.git
   cd GopherGather
   ```

2. Install dependencies
   ```bash
   cd packages/webapp
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open your browser  
   Navigate to http://localhost:3000

## Project Structure

```
packages/webapp/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── package.json
```

## Key Components

- NavigationBar: Main navigation with logo and user actions
- FilterNavigation: Category filtering for events
- EventCard: Individual event display component
- EventsWithFilters: Main events listing with filtering logic

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details
