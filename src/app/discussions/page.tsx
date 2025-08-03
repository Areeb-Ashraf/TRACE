'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DiscussionPost {
  id: string;
  content: string;
  createdAt: string;
  author: User;
  replies: DiscussionPost[];
}

interface DiscussionBoard {
  id: string;
  prompt: string;
  assignment: {
    id: string;
    title: string;
    class: {
      name: string;
    };
  };
  posts: DiscussionPost[];
  _count: {
    posts: number;
  };
}

export default function DiscussionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [discussionBoards, setDiscussionBoards] = useState<DiscussionBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchDiscussionBoards();
  }, [session, status, router]);

  const fetchDiscussionBoards = async () => {
    try {
      const response = await fetch('/api/discussions');
      const data = await response.json();
      if (response.ok) {
        setDiscussionBoards(data.discussionBoards);
      }
    } catch (error) {
      console.error('Error fetching discussion boards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discussion Boards</h1>
        <p className="text-gray-600">
          Engage in discussions with your classmates and professors
        </p>
      </div>

      {discussionBoards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No discussion boards yet</h3>
          <p className="text-gray-500">
            Discussion boards will appear here when your professors create them for assignments.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {discussionBoards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {board.assignment.class.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {board._count.posts} posts
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {board.assignment.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {board.prompt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {board.posts.length > 0 && (
                      <span>
                        Last activity: {format(new Date(board.posts[0].createdAt), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                  
                  <Link
                    href={`/discussions/${board.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Discussion
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 