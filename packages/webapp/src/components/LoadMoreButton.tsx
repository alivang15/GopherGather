"use client";

interface LoadMoreButtonProps {
  remainingCount: number;
  onLoadMore: () => void;
}

export default function LoadMoreButton({ remainingCount, onLoadMore }: LoadMoreButtonProps) {
  return (
    <div className="text-center mt-8">
      <button 
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        onClick={onLoadMore}
      >
        Load More Past Events ({remainingCount} remaining)
      </button>
    </div>
  );
}
