"use client";

interface FilterButtonsProps {
  currentCount: number;
  upcomingCount: number;
  pastCount: number;
}

export default function FilterButtons({ currentCount, upcomingCount, pastCount }: FilterButtonsProps) {
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex justify-center space-x-4 mt-4">
      {currentCount > 0 && (
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => scrollToSection('current-events')}
        >
          🔴 Happening Now ({currentCount})
        </button>
      )}
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => scrollToSection('upcoming-events')}
      >
        🎯 Upcoming ({upcomingCount})
      </button>
      <button 
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        onClick={() => scrollToSection('past-events')}
      >
        📚 Past Events ({pastCount})
      </button>
    </div>
  );
}
