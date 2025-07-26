'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from '@/components/Header';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  class?: {
    name: string;
  };
  status?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  class?: {
    name: string;
  };
  status?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  classId: string;
  class?: {
    name: string;
  };
  status?: string;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, quizzesRes, lessonsRes] = await Promise.all([
        fetch('/api/assignments'),
        fetch('/api/quizzes'),
        fetch('/api/lessons'),
      ]);

      const assignmentsData = await assignmentsRes.json();
      const quizzesData = await quizzesRes.json();
      const lessonsData = await lessonsRes.json();

      setAssignments(assignmentsData.assignments || []);
      setQuizzes(quizzesData.quizzes || []);
      setLessons(lessonsData.lessons || []);

      const calendarEvents: Event[] = [
        ...(assignmentsData.assignments || []).map((a: Assignment) => ({
          title: `Assignment: ${a.title}`,
          start: new Date(a.dueDate),
          end: new Date(a.dueDate),
          resource: { type: 'assignment', ...a },
        })),
        ...(quizzesData.quizzes || []).map((q: Quiz) => ({
          title: `Quiz: ${q.title}`,
          start: new Date(q.dueDate),
          end: new Date(q.dueDate),
          resource: { type: 'quiz', ...q },
        })),
        ...(lessonsData.lessons || []).filter((l: Lesson) => l.dueDate).map((l: Lesson) => ({
          title: `Lesson Due: ${l.title}`,
          start: new Date(l.dueDate!),
          end: new Date(l.dueDate!),
          resource: { type: 'lesson', ...l },
        })),
      ];
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600'; // Overdue
    if (diffDays <= 3) return 'text-orange-600'; // Due soon
    return 'text-green-600'; // On time
  };

  const getStatusText = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Assignments & Due Dates</h1>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button 
            onClick={() => setView('calendar')} 
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'calendar' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Calendar
          </button>
          <button 
            onClick={() => setView('list')} 
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'list' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white p-6 rounded-lg shadow-lg" style={{ height: '70vh' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={(event) => {
              const resource = event.resource as any;
              if (resource?.type === 'assignment') {
                return { style: { backgroundColor: '#3B82F6', color: 'white' } };
              } else if (resource?.type === 'quiz') {
                return { style: { backgroundColor: '#10B981', color: 'white' } };
              } else {
                return { style: { backgroundColor: '#F59E0B', color: 'white' } };
              }
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Assignments Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Assignments</h2>
            {assignments.length === 0 ? (
              <p className="text-gray-500">No assignments found.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{assignment.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Class: {assignment.class?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getStatusColor(assignment.dueDate)}`}>
                          {getStatusText(assignment.dueDate)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quizzes Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Quizzes</h2>
            {quizzes.length === 0 ? (
              <p className="text-gray-500">No quizzes found.</p>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{quiz.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{quiz.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Class: {quiz.class?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getStatusColor(quiz.dueDate)}`}>
                          {getStatusText(quiz.dueDate)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {format(new Date(quiz.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-orange-600">Lessons</h2>
            {lessons.length === 0 ? (
              <p className="text-gray-500">No lessons found.</p>
            ) : (
              <div className="space-y-4">
                {lessons.filter(lesson => lesson.dueDate).map((lesson) => (
                  <div key={lesson.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{lesson.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          Class: {lesson.class?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getStatusColor(lesson.dueDate!)}`}>
                          {getStatusText(lesson.dueDate!)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {format(new Date(lesson.dueDate!), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 