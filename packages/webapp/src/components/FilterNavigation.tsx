"use client";

interface FilterNavigationProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function FilterNavigation({ 
  selectedCategory, 
  onCategoryChange
}: FilterNavigationProps) {
  const categories = [
    { id: 'All Events', label: 'All Events' },
    { id: 'Academic', label: 'Academic' },
    { id: 'Career', label: 'Career' },
    { id: 'Cultural', label: 'Cultural' },
    { id: 'Social', label: 'Social' },
    { id: 'Sports', label: 'Sports' },
    { id: 'Workshop', label: 'Workshop' },
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-100 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${selectedCategory === category.id
                  ? 'bg-[#7a0019] text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
