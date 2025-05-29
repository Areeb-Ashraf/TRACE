'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizTaker from '@/components/QuizTaker';
import UserDropdown from '@/components/UserDropdown';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  maxWords?: number;
  minWords?: number;
  professor: {
    id: string;
    name: string;
  };
  submissions: Submission[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  timeLimit?: number;
  allowReview: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: any[];
  professor: {
    id: string;
    name: string;
  };
  submissions: QuizSubmission[];
}

interface Submission {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  submittedAt?: string;
  grade?: number;
}

interface QuizSubmission {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score?: number;
  submittedAt?: string;
  grade?: number;
  quiz: Quiz;
  answers: any[];
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizSubmission, setCurrentQuizSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes'>('assignments');

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

    fetchAssignments();
    fetchQuizzes();
  }, [session, status, router]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
      } else {
        setError('Failed to fetch assignments');
      }
    } catch (error) {
      setError('Error fetching assignments');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (error) {
      setError('Error fetching quizzes');
      console.error('Error:', error);
    }
  };

  const handleStartAssignment = async (assignmentId: string) => {
    try {
      setError('');
      
      // Create or resume submission
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to editor with assignment context
        router.push(`/editor?submissionId=${data.submission.id}&assignmentId=${assignmentId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start assignment');
      }
    } catch (error) {
      setError('Error starting assignment');
      console.error('Error:', error);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      setError('');
      
      // Create or resume quiz submission
      const response = await fetch('/api/quiz-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuizSubmission(data.submission);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start quiz');
      }
    } catch (error) {
      setError('Error starting quiz');
      console.error('Error:', error);
    }
  };

  const handleSaveQuizAnswers = async (answers: any[], timeSpent: number) => {
    if (!currentQuizSubmission) return;

    try {
      const response = await fetch(`/api/quiz-submissions/${currentQuizSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_answers',
          answers,
          timeSpent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save answers');
      }
    } catch (error) {
      setError('Error saving answers');
      console.error('Error:', error);
    }
  };

  const handleSubmitQuiz = async (answers: any[], timeSpent: number) => {
    if (!currentQuizSubmission) return;

    try {
      const response = await fetch(`/api/quiz-submissions/${currentQuizSubmission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submit',
          answers,
          timeSpent
        }),
      });

      if (response.ok) {
        // Quiz completed successfully - clear current submission
        setCurrentQuizSubmission(null);
        fetchQuizzes(); // Refresh quiz list to show updated status
        
        // Show success message
        alert('Quiz submitted successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit quiz');
      }
    } catch (error) {
      setError('Error submitting quiz');
      console.error('Error:', error);
    }
  };

  const handleExitQuiz = () => {
    // User is exiting quiz - clear current submission (monitoring will stop in QuizTaker)
    setCurrentQuizSubmission(null);
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = assignment.submissions[0];
    if (!submission) return 'pending';
    return submission.status.toLowerCase();
  };

  const getQuizStatus = (quiz: Quiz) => {
    const submission = quiz.submissions[0];
    if (!submission) return 'pending';
    return submission.status.toLowerCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'submitted': return 'text-green-600 bg-green-100';
      case 'graded': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  // If taking a quiz, show the quiz interface
  if (currentQuizSubmission) {
    return (
      <QuizTaker
        submission={currentQuizSubmission}
        onSaveAnswers={handleSaveQuizAnswers}
        onSubmit={handleSubmitQuiz}
        onExit={handleExitQuiz}
        loading={loading}
      />
    );
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalTasks = assignments.length + quizzes.length;
  const pendingTasks = assignments.filter(a => getAssignmentStatus(a) === 'pending').length + 
                     quizzes.filter(q => getQuizStatus(q) === 'pending').length;
  const inProgressTasks = assignments.filter(a => getAssignmentStatus(a) === 'in_progress').length + 
                         quizzes.filter(q => getQuizStatus(q) === 'in_progress').length;
  const completedTasks = assignments.filter(a => ['submitted', 'graded'].includes(getAssignmentStatus(a))).length + 
                        quizzes.filter(q => ['submitted', 'graded'].includes(getQuizStatus(q))).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">TRACE</Link>
              <span className="ml-4 text-gray-600 dark:text-gray-300">Student Dashboard</span>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/editor"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Practice Editor
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Home
              </Link>
              <UserDropdown />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session?.user?.name || 'Student'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete your assignments and quizzes using our monitored platform to ensure academic integrity.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Essay Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'quizzes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quizzes ({quizzes.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Essay Assignments</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No essay assignments available at the moment. Check back later for new assignments.
                </div>
              ) : (
                assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment);
                  const submission = assignment.submissions[0];
                  const overdue = isOverdue(assignment.dueDate);
                  
                  return (
                    <div key={assignment.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {assignment.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                              {overdue && status === 'pending' && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Professor: {assignment.professor.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {assignment.description}
                          </p>
                          {assignment.instructions && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
                              Instructions: {assignment.instructions}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              Due: {formatDate(assignment.dueDate)}
                            </div>
                            {assignment.estimatedTime && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Estimated: {assignment.estimatedTime} minutes
                              </div>
                            )}
                            {assignment.minWords && assignment.maxWords && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                {assignment.minWords} - {assignment.maxWords} words
                              </div>
                            )}
                          </div>
                          
                          {/* Show submission details if graded */}
                          {submission && submission.status === 'GRADED' && submission.grade !== undefined && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Grade: {submission.grade}/100
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-6">
                          {status === 'pending' && !overdue && (
                            <button
                              onClick={() => handleStartAssignment(assignment.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Start Assignment
                            </button>
                          )}
                          {status === 'in_progress' && !overdue && (
                            <button
                              onClick={() => handleStartAssignment(assignment.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Continue Assignment
                            </button>
                          )}
                          {status === 'submitted' && (
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Submitted</div>
                              <div className="text-xs text-gray-400">
                                {submission?.submittedAt ? formatDate(submission.submittedAt) : ''}
                              </div>
                            </div>
                          )}
                          {status === 'graded' && (
                            <div className="text-center">
                              <div className="text-sm text-green-600 font-medium mb-1">Graded</div>
                              <div className="text-xs text-gray-400">
                                {submission?.submittedAt ? formatDate(submission.submittedAt) : ''}
                              </div>
                            </div>
                          )}
                          {overdue && status === 'pending' && (
                            <div className="text-center">
                              <div className="text-sm text-red-600 font-medium">Overdue</div>
                              <div className="text-xs text-gray-400">Cannot start</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Quizzes</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {quizzes.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No quizzes available at the moment. Check back later for new quizzes.
                </div>
              ) : (
                quizzes.map((quiz) => {
                  const status = getQuizStatus(quiz);
                  const submission = quiz.submissions[0];
                  const overdue = isOverdue(quiz.dueDate);
                  
                  return (
                    <div key={quiz.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {quiz.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                              {overdue && status === 'pending' && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Professor: {quiz.professor.name}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {quiz.description}
                          </p>
                          {quiz.instructions && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
                              Instructions: {quiz.instructions}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                              </svg>
                              Due: {formatDate(quiz.dueDate)}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                              Questions: {quiz.questions?.length || 0}
                            </div>
                            {quiz.estimatedTime && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Estimated: {quiz.estimatedTime} minutes
                              </div>
                            )}
                            {quiz.timeLimit && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Time Limit: {quiz.timeLimit} minutes
                              </div>
                            )}
                          </div>
                          
                          {/* Show submission details if graded */}
                          {submission && submission.status === 'GRADED' && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                  Score: {submission.score ? Math.round(submission.score) : 0}%
                                </span>
                                {submission.grade !== undefined && (
                                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Grade: {submission.grade}/100
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-6">
                          {status === 'pending' && !overdue && (
                            <button
                              onClick={() => handleStartQuiz(quiz.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Start Quiz
                            </button>
                          )}
                          {status === 'in_progress' && !overdue && (
                            <button
                              onClick={() => handleStartQuiz(quiz.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Continue Quiz
                            </button>
                          )}
                          {status === 'submitted' && (
                            <div className="text-center">
                              <div className="text-sm text-gray-500 mb-1">Submitted</div>
                              <div className="text-xs text-gray-400">
                                {submission?.submittedAt ? formatDate(submission.submittedAt) : ''}
                              </div>
                              {submission?.score !== undefined && (
                                <div className="text-xs text-blue-600 font-medium">
                                  Score: {Math.round(submission.score)}%
                                </div>
                              )}
                            </div>
                          )}
                          {status === 'graded' && (
                            <div className="text-center">
                              <div className="text-sm text-green-600 font-medium mb-1">Graded</div>
                              <div className="text-xs text-gray-400">
                                {submission?.submittedAt ? formatDate(submission.submittedAt) : ''}
                              </div>
                              {submission?.score !== undefined && (
                                <div className="text-xs text-green-600 font-medium">
                                  Score: {Math.round(submission.score)}%
                                </div>
                              )}
                            </div>
                          )}
                          {overdue && status === 'pending' && (
                            <div className="text-center">
                              <div className="text-sm text-red-600 font-medium">Overdue</div>
                              <div className="text-xs text-gray-400">Cannot start</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 