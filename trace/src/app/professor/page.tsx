'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnalysisDashboard from '@/components/AnalysisDashboard';
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  submissions: Submission[];
  _count: {
    submissions: number;
  };
}

interface Submission {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  textContent?: string;
  wordCount?: number;
  timeSpent?: number;
  submittedAt?: string;
  grade?: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ProfessorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');

  // Form data for creating assignments
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    estimatedTime: '',
    maxWords: '',
    minWords: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "PROFESSOR") {
      router.push("/dashboard");
      return;
    }

    fetchAssignments();
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          maxWords: formData.maxWords ? parseInt(formData.maxWords) : null,
          minWords: formData.minWords ? parseInt(formData.minWords) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments([data.assignment, ...assignments]);
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          instructions: '',
          dueDate: '',
          estimatedTime: '',
          maxWords: '',
          minWords: '',
          status: 'DRAFT'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create assignment');
      }
    } catch (error) {
      setError('Error creating assignment');
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        setError('Failed to update assignment status');
      }
    } catch (error) {
      setError('Error updating assignment');
      console.error('Error:', error);
    }
  };

  const handleViewSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSubmission(data);
      } else {
        setError('Failed to fetch submission details');
      }
    } catch (error) {
      setError('Error fetching submission');
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'PUBLISHED': return 'text-green-600 bg-green-100';
      case 'ARCHIVED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'SUBMITTED': return 'text-purple-600 bg-purple-100';
      case 'GRADED': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Show analysis dashboard if a submission is selected
  if (selectedSubmission && selectedSubmission.analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600 dark:text-gray-300">
                  Analysis: {selectedSubmission.submission.student.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  ← Back to Dashboard
                </button>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalysisDashboard 
            result={selectedSubmission.analysisData}
            textContent={selectedSubmission.submission.textContent}
            submissionInfo={{
              studentName: selectedSubmission.submission.student.name,
              assignmentTitle: selectedSubmission.submission.assignment.title,
              submissionDate: selectedSubmission.submission.submittedAt,
              wordCount: selectedSubmission.submission.wordCount,
              timeSpent: selectedSubmission.submission.timeSpent
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
              <span className="ml-4 text-gray-600 dark:text-gray-300">Professor Dashboard</span>
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
            Professor Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create assignments and monitor student submissions for academic integrity.
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Published</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.filter(a => a.status === 'PUBLISHED').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.reduce((sum, a) => sum + a._count.submissions, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Needs Review</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assignments.reduce((sum, a) => sum + (a.submissions?.filter(s => s.status === 'SUBMITTED').length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assignments
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`ml-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recent Submissions
              </button>
            </nav>
          </div>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Assignments</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Assignment
              </button>
            </div>

            {showCreateForm && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={formData.instructions}
                      onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Words
                      </label>
                      <input
                        type="number"
                        value={formData.minWords}
                        onChange={(e) => setFormData({...formData, minWords: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Words
                      </label>
                      <input
                        type="number"
                        value={formData.maxWords}
                        onChange={(e) => setFormData({...formData, maxWords: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Create Assignment
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No assignments created yet. Create your first assignment to get started.
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                              {assignment.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {assignment._count.submissions} submissions
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          {assignment.description}
                        </p>
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
                              {assignment.estimatedTime} minutes
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 space-y-2">
                        {assignment.status === 'DRAFT' && (
                          <button
                            onClick={() => handleStatusChange(assignment.id, 'PUBLISHED')}
                            className="block w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Publish
                          </button>
                        )}
                        {assignment.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleStatusChange(assignment.id, 'ARCHIVED')}
                            className="block w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Archive
                          </button>
                        )}
                        {(assignment.submissions?.filter(s => s.status === 'SUBMITTED').length || 0) > 0 && (
                          <button
                            onClick={() => setActiveTab('submissions')}
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            View Submissions
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Student Submissions</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.flatMap(a => (a.submissions || []).filter(s => s.status === 'SUBMITTED')).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No submissions to review yet.
                </div>
              )}
              {assignments.map(assignment => 
                (assignment.submissions || []).filter(s => s.status === 'SUBMITTED').map(submission => (
                  <div key={submission.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {submission.student.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          Assignment: {assignment.title}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Words: {submission.wordCount || 0}</span>
                          <span>Time: {submission.timeSpent || 0}m</span>
                          <span>Submitted: {submission.submittedAt ? formatDate(submission.submittedAt) : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => handleViewSubmission(submission.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          View Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ).flat()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 