// filepath: /Users/alivang/Desktop/PersonalProjects/umn-events/packages/webapp/src/app/events/[id]/not-found.tsx
import Link from 'next/link';

export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Not Found</h2>
        <p className="text-gray-600 mb-8">
          The event you&apos;re looking for doesn&apos;t exist or has been removed.
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
