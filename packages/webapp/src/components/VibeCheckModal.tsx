"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from "next/link";

interface VibeCheck {
  id: string;
  event_id: string;
  user_name: string;
  user_email?: string;
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
  { value: 1, label: 'Boring', emoji: '😩' },
  { value: 2, label: 'Meh', emoji: '😐' },
  { value: 3, label: 'Good', emoji: '😊' },
  { value: 4, label: 'Great', emoji: '😁' },
  { value: 5, label: 'Lit', emoji: '🔥' },
];

export default function VibeCheckModal({ eventId, eventTitle, isOpen, onClose }: VibeCheckModalProps) {
  const [vibeChecks, setVibeChecks] = useState<VibeCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // ✅ Get authentication state
  const { user, loading: authLoading } = useAuth();

  // ✅ Auto-fill user name from authenticated user
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      // Prefer explicit full_name metadata, else fallback to email local-part
      const full = user?.user_metadata?.full_name;
      const base = full && typeof full === 'string' && full.trim().length > 0
        ? full
        : (user.email?.split('@')[0] ?? '');
      const display = base.charAt(0).toUpperCase() + base.slice(1);
      setUserName(display);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && eventId) {
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
        .not('comment', 'is', null)
        .neq('comment', '')
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
    if (!user) {
      alert('Please sign in to submit a vibe check!');
      return;
    }
    if (!selectedVibe || !userName.trim()) return;

    try {
      setSubmitting(true);
      const selectedVibeOption = VIBE_OPTIONS.find(v => v.value === selectedVibe);

      const { data, error } = await supabase
        .from('vibe_checks')
        .insert([{
          event_id: eventId,
          user_name: userName.trim(),
          user_email: user.email, // must match authenticated user
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
        setVibeChecks(prev => [data, ...prev]); // local refresh
        
        // Reset form
        setSelectedVibe(null);
        setComment('');
        setShowSubmitForm(false);
        
        // Show success message
        alert('Vibe check submitted! 🎉');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (checkId: string) => {
    if (!user) return;
    if (!confirm("Delete your comment for this vibe check?")) return;
    try {
      setDeletingId(checkId);
      const { error } = await supabase
        .from("vibe_checks")
        .update({ comment: null })
        .eq("id", checkId)
        .eq("user_email", user.email);
      if (error) throw error;
     // Remove from UI list
     setVibeChecks((prev) => prev.filter((vc) => vc.id !== checkId));
    } catch (e: any) {
      alert(`Failed to delete comment: ${e?.message ?? "Unknown error"}`);
    } finally {
      setDeletingId(null);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return {
        date: 'Today',
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } else if (diffInHours < 48) {
      return {
        date: 'Yesterday',
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } else {
      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    }
  };

  if (!isOpen) return null;

  // ✅ Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-purple-600">
            <span className="mr-2">✨ Vibe Check</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none p-1"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ✅ Authentication Check */}
          {!user ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sign In Required
              </h3>
              
              <p className="text-sm text-gray-600 mb-6">
                You need to be signed in to view and submit vibe checks for this event.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Keep the modal open and redirect with current URL as redirect parameter
                    const currentUrl = window.location.pathname + window.location.search;
                    window.location.href = `/auth/sign-in?redirect=${encodeURIComponent(currentUrl)}&vibe_check=true&event_id=${eventId}`;
                  }}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  Sign In to Continue
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* ✅ Show vibe checks content only for authenticated users */
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading vibe checks...</p>
                </div>
              ) : (
                <>
                  {/* Statistics Section */}
                  {vibeChecks.length > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {getAverageVibe()}/5
                          </div>
                          <div className="text-sm text-gray-600">Average Vibe</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {vibeChecks.length}
                          </div>
                          <div className="text-sm text-gray-600">Total Checks</div>
                        </div>
                      </div>

                      {/* Vibe Distribution */}
                      <div className="space-y-2">
                        {getVibeDistribution().map(vibe => (
                          <div key={vibe.value} className="flex items-center space-x-2">
                            <span className="text-lg">{vibe.emoji}</span>
                            <span className="text-sm text-gray-700">{vibe.label}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${vibeChecks.length > 0 ? (vibe.count / vibeChecks.length) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{vibe.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Vibe Check Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Share Your Vibe!</h3>
                    
                    {/* Optional: link to full page */}
                    <div className="mb-3 text-right">
                      <Link href={`/events/${eventId}/vibe-check`} className="text-xs text-purple-600 hover:underline">
                         Open full Vibe Check page
                       </Link>
                    </div>
                    {!showSubmitForm ? (
                      <button
                        onClick={() => setShowSubmitForm(true)}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors duration-200"
                      >
                        Add Your Vibe Check
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* User Info Display */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>Posting as:</span>
                          <span className="font-medium text-purple-600">{userName}</span>
                          <span className="text-xs">({user.email})</span>
                        </div>

                        {/* Vibe Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            How's the vibe?
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {VIBE_OPTIONS.map(vibe => (
                              <button
                                key={vibe.value}
                                onClick={() => setSelectedVibe(vibe.value)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors duration-200 min-h-[80px] ${
                                  selectedVibe === vibe.value
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-300 hover:border-purple-400 bg-white'
                                }`}
                              >
                                <div className="text-2xl mb-1">{vibe.emoji}</div>
                                <div className="text-xs font-medium text-gray-800 text-center leading-tight whitespace-nowrap">{vibe.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comment (Optional)
                          </label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us more about the vibe..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-600 bg-white placeholder-gray-400 text-sm leading-relaxed"
                            rows={3}
                            maxLength={200}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {comment.length}/200
                          </div>
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
                            onClick={() => {
                              setShowSubmitForm(false);
                              setSelectedVibe(null);
                              setComment('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vibe Checks List */}
                  <div className="mb-4">
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
                        {vibeChecks.map(check => {
                          const { date, time } = formatDateTime(check.created_at);
                          return (
                            <div key={check.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <span className="text-lg">{check.vibe_emoji}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-sm">
                                      <span className="font-medium text-gray-900">{check.user_name}</span>
                                      <span className="text-gray-500">•</span>
                                      <span className="text-gray-500">{date} at {time}</span>
                                    </div>
                                    {user && check.comment && check.user_email === user.email && (
                                      <button
                                        onClick={() => deleteComment(check.id)}
                                        disabled={deletingId === check.id}
                                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                      >
                                        {deletingId === check.id ? "Deleting..." : "Delete"}
                                      </button>
                                    )}
                                  </div>
                                  {check.comment && (
                                    <p className="text-sm text-gray-700 mt-1">{check.comment}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
