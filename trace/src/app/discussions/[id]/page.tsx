'use client';

import { useState, useEffect, useRef } from 'react';
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
}

interface Props {
  params: {
    id: string;
  };
}

export default function DiscussionBoardPage({ params }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [discussionBoard, setDiscussionBoard] = useState<DiscussionBoard | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const postsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchDiscussionBoard();
    fetchPosts();
  }, [session, status, router, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [posts]);

  const scrollToBottom = () => {
    postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDiscussionBoard = async () => {
    try {
      const response = await fetch('/api/discussions');
      const data = await response.json();
      if (response.ok) {
        const board = data.discussionBoards.find((b: DiscussionBoard) => b.id === params.id);
        setDiscussionBoard(board);
      }
    } catch (error) {
      console.error('Error fetching discussion board:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/discussions/posts?boardId=${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/discussions/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: params.id,
          content: newPost.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prev => [data.post, ...prev]);
        setNewPost('');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSending(false);
    }
  };

  const createReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/discussions/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: params.id,
          content: replyContent.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the posts to include the new reply
        setPosts(prev => 
          prev.map(post => 
            post.id === parentId 
              ? { ...post, replies: [...post.replies, data.post] }
              : post
          )
        );
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setSending(false);
    }
  };

  const PostComponent = ({ post, level = 0 }: { post: DiscussionPost; level?: number }) => (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">
              {post.author.name || post.author.email}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              post.author.role === 'PROFESSOR' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {post.author.role}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {format(new Date(post.createdAt), 'MMM dd, yyyy HH:mm')}
          </span>
        </div>
        
        <p className="text-gray-900 mb-3">{post.content}</p>
        
        <button
          onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>

        {replyingTo === post.id && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => createReply(post.id)}
                disabled={!replyContent.trim() || sending}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                {sending ? 'Sending...' : 'Post Reply'}
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {post.replies.map((reply) => (
        <PostComponent key={reply.id} post={reply} level={level + 1} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!discussionBoard) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Discussion Board Not Found</h1>
          <p className="text-gray-600 mb-4">The discussion board you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/discussions"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Discussions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/discussions"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Discussions
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {discussionBoard.assignment.class.name}
            </span>
            <span className="text-sm text-gray-500">
              {posts.length} posts
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {discussionBoard.assignment.title}
          </h1>
          
          <p className="text-gray-700 text-lg">
            {discussionBoard.prompt}
          </p>
        </div>
      </div>

      {/* New Post Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Start a Discussion</h2>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your thoughts, ask questions, or start a discussion..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={createPost}
            disabled={!newPost.trim() || sending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {sending ? 'Posting...' : 'Post Discussion'}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500">
              Be the first to start the discussion!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostComponent key={post.id} post={post} />
          ))
        )}
        <div ref={postsEndRef} />
      </div>
    </div>
  );
} 