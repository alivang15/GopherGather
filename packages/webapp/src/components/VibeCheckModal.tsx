"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VibeCheck {
  id: string;
  event_id: string;
  user_name: string;
  vibe_rating: number;
  vibe_emoji: string;
  comment: string;
  created_at: string;
}

interface VibeCheckModalProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const VIBE_OPTIONS = [
  { emoji: '🔥', label: 'Lit!', value: 5, color: 'text-red-500' },
  { emoji: '😎', label: 'Cool', value: 4, color: 'text-blue-500' },
  { emoji: '😊', label: 'Good', value: 3, color: 'text-green-500' },
  { emoji: '😐', label: 'Meh', value: 2, color: 'text-yellow-500' },
  { emoji: '😴', label: 'Boring', value: 1, color: 'text-gray-500' },
];

export default function VibeCheckModal({ eventId, eventTitle, isOpen, onClose }: VibeCheckModalProps) {
  const [vibeChecks, setVibeChecks] = useState<VibeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  
  // Form state
  const [userName, setUserName] = useState('');
  const [selectedVibe, setSelectedVibe] = useState<number | null>(null);
  const [comment, setComment] = useState('');

  // Helper function to format date and time for display
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    
    return { date: formattedDate, time: formattedTime };
  };

  // Fetch vibe checks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVibeChecks();
    }
  }, [isOpen, eventId]);

  const fetchVibeChecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vibe_checks')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vibe checks:', error);
      } else {
        setVibeChecks(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitVibeCheck = async () => {
    if (!selectedVibe || !userName.trim()) return;

    try {
      setSubmitting(true);
      const selectedVibeOption = VIBE_OPTIONS.find(v => v.value === selectedVibe);
      
      const { data, error } = await supabase
        .from('vibe_checks')
        .insert([{
          event_id: eventId,
          user_name: userName.trim(),
          vibe_rating: selectedVibe,
          vibe_emoji: selectedVibeOption?.emoji || '😊',
          comment: comment.trim()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting vibe check:', error);
        alert('Failed to submit vibe check. Please try again.');
      } else {
        // Add new vibe check to the list
        setVibeChecks(prev => [data, ...prev]);
        
        // Reset form
        setUserName('');
        setSelectedVibe(null);
        setComment('');
        setShowSubmitForm(false);
        
        // Show success message
        alert('Vibe check submitted! 🎉');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageVibe = () => {
    if (vibeChecks.length === 0) return null;
    const average = vibeChecks.reduce((sum, check) => sum + check.vibe_rating, 0) / vibeChecks.length;
    return Math.round(average * 10) / 10;
  };

  const getVibeDistribution = () => {
    const distribution = VIBE_OPTIONS.map(option => ({
      ...option,
      count: vibeChecks.filter(check => check.vibe_rating === option.value).length
    }));
    return distribution;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">✨ Vibe Check</h2>
              <p className="text-purple-100 text-sm">{eventTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vibe checks...</p>
            </div>
          ) : (
            <>
              {/* Vibe Summary */}
              {vibeChecks.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Event Vibe Summary</h3>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{getAverageVibe()}/5</div>
                      <div className="text-sm text-gray-600">Average Vibe</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{vibeChecks.length}</div>
                      <div className="text-sm text-gray-600">Total Checks</div>
                    </div>
                  </div>
                  
                  {/* Vibe Distribution */}
                  <div className="space-y-2">
                    {getVibeDistribution().map((vibe) => (
                      <div key={vibe.value} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{vibe.emoji}</span>
                          <span className="text-sm text-gray-700">{vibe.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${vibeChecks.length > 0 ? (vibe.count / vibeChecks.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{vibe.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Vibe Check Button */}
              {!showSubmitForm && (
                <button
                  onClick={() => setShowSubmitForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium mb-6"
                >
                  ✨ Add Your Vibe Check
                </button>
              )}

              {/* Submit Form */}
              {showSubmitForm && (
                <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h3 className="font-semibold text-gray-900 mb-4">Share Your Vibe!</h3>
                  
                  {/* Name Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      maxLength={50}
                    />
                  </div>

                  {/* Vibe Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">How's the vibe?</label>
                    <div className="grid grid-cols-5 gap-2">
                      {VIBE_OPTIONS.map((vibe) => (
                        <button
                          key={vibe.value}
                          onClick={() => setSelectedVibe(vibe.value)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            selectedVibe === vibe.value
                              ? 'border-purple-500 bg-purple-100 scale-105'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{vibe.emoji}</div>
                          <div className="text-xs font-medium text-gray-700">{vibe.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us more about the vibe..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      maxLength={200}
                    />
                    <div className="text-xs text-gray-500 mt-1">{comment.length}/200</div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={submitVibeCheck}
                      disabled={!selectedVibe || !userName.trim() || submitting}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {submitting ? 'Submitting...' : 'Submit Vibe Check'}
                    </button>
                    <button
                      onClick={() => setShowSubmitForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Vibe Checks List - WITH DATE AND TIME */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Vibe Checks ({vibeChecks.length})
                </h3>
                
                {vibeChecks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎭</div>
                    <p>No vibe checks yet!</p>
                    <p className="text-sm">Be the first to share the vibe.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {vibeChecks.map((check) => {
                      const { date, time } = formatDateTime(check.created_at);
                      return (
                        <div key={check.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{check.vibe_emoji}</span>
                              <span className="font-medium text-gray-900">{check.user_name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">{date}</div>
                              <div className="text-xs text-gray-500">{time}</div>
                            </div>
                          </div>
                          {check.comment && (
                            <p className="text-sm text-gray-700">{check.comment}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
