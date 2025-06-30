'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LessonViewer from '@/components/LessonViewer';
import UserDropdown from '@/components/UserDropdown';

export default function LessonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }

    fetchLesson();
  }, [session, status, router, lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (response.ok) {
        const data = await response.json();
        setLesson(data.lesson);
      } else if (response.status === 404) {
        setError('Lesson not found or not available');
      } else {
        setError('Failed to fetch lesson');
      }
    } catch (error) {
      setError('Error fetching lesson');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (progress: any) => {
    // Update lesson progress data
    if (lesson) {
      setLesson({
        ...lesson,
        progress: [progress]
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600">Lesson</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/student"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <Link
                href="/student"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600">Lesson</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/student"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  ← Back to Dashboard
                </Link>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
            <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist or isn't available.</p>
            <Link
              href="/student"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
              <div className="text-gray-400">›</div>
              <Link 
                href="/student" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Dashboard
              </Link>
              <div className="text-gray-400">›</div>
              <span className="text-gray-600">Lesson</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/student"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Lesson Content */}
      <LessonViewer 
        lesson={lesson} 
        onProgressUpdate={handleProgressUpdate}
      />
    </div>
  );
} 