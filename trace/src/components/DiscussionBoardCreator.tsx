'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface Assignment {
  id: string;
  title: string;
  class: {
    name: string;
  };
}

interface DiscussionBoardCreatorProps {
  onDiscussionCreated?: () => void;
}

export default function DiscussionBoardCreator({ onDiscussionCreated }: DiscussionBoardCreatorProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingAssignments, setFetchingAssignments] = useState(true);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments');
      const data = await response.json();
      if (response.ok) {
        // Filter out assignments that already have discussion boards
        const assignmentsWithoutDiscussions = data.assignments.filter((assignment: any) => 
          !assignment.discussionBoard
        );
        setAssignments(assignmentsWithoutDiscussions);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      showError('Failed to load assignments');
    } finally {
      setFetchingAssignments(false);
    }
  };

  const createDiscussionBoard = async () => {
    if (!selectedAssignment || !prompt.trim()) {
      showError('Please select an assignment and provide a discussion prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment,
          prompt: prompt.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        success('Discussion board created successfully!');
        setSelectedAssignment('');
        setPrompt('');
        onDiscussionCreated?.();
        // Refresh assignments to remove the one that now has a discussion board
        fetchAssignments();
      } else {
        showError(data.error || 'Failed to create discussion board');
      }
    } catch (error) {
      console.error('Error creating discussion board:', error);
      showError('Failed to create discussion board');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingAssignments) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Create Discussion Board</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments available</h3>
          <p className="text-gray-500">
            All your assignments already have discussion boards, or you need to create assignments first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Create Discussion Board</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Assignment *
          </label>
          <select
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Choose an assignment</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title} ({assignment.class.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discussion Prompt *
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a discussion prompt or question for students to respond to..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            This prompt will be displayed to students when they access the discussion board.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={createDiscussionBoard}
            disabled={!selectedAssignment || !prompt.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create Discussion Board'}
          </button>
        </div>
      </div>
    </div>
  );
} 