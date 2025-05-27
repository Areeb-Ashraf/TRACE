'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Editor from '@/components/Editor';
import Calibration from '@/components/Calibration';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import UserDropdown from '@/components/UserDropdown';
import { useEditorStore } from '@/store/editorStore';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  maxWords?: number;
  minWords?: number;
}

interface Submission {
  id: string;
  status: string;
  textContent?: string;
  wordCount?: number;
  timeSpent?: number;
  assignment: Assignment;
}

export default function EditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { actions, clearActions } = useEditorStore();
  const [showActions, setShowActions] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [referenceActionsList, setReferenceActionsList] = useState<any[][]>([]);
  const [userId] = useState<string>(`user_${Date.now().toString()}`);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'calibration'>('calibration');
  const [calibrationMetrics, setCalibrationMetrics] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Assignment context from URL parameters
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');
  const submissionId = searchParams.get('submissionId');
  const isAssignmentMode = !!assignmentId && !!submissionId;

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (isAssignmentMode) {
      fetchAssignmentAndSubmission();
    } else {
      setLoading(false);
    }
  }, [session, status, assignmentId, submissionId, router]);

  const fetchAssignmentAndSubmission = async () => {
    try {
      setLoading(true);
      
      if (submissionId) {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (response.ok) {
          const data = await response.json();
          setSubmission(data.submission);
          setAssignment(data.submission.assignment);
          
          // If submission is already submitted, redirect back
          if (data.submission.status === 'SUBMITTED') {
            setError('This assignment has already been submitted.');
            setTimeout(() => router.push('/student'), 3000);
            return;
          }
        } else {
          setError('Failed to fetch submission details');
        }
      }
    } catch (error) {
      setError('Error loading assignment');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle completion of calibration
  const handleCalibrationComplete = (actions: any[]) => {
    setReferenceActionsList(prev => [...prev, actions]);
    setCalibrationComplete(true);
    
    // Fetch metrics for this calibration
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions }),
    })
      .then(res => res.json())
      .then(data => setCalibrationMetrics(prev => [...prev, data.metrics]))
      .catch(console.error);
      
    // If in assignment mode, automatically switch to editor after calibration
    if (isAssignmentMode) {
      setActiveTab('editor');
    }
  };

  // Handle analysis results
  const handleAnalysisResults = (results: any) => {
    setAnalysisResult(results);
    setActiveTab('analysis');
  };

  // Save progress periodically
  const saveProgress = async (textContent: string, wordCount: number, timeSpent: number) => {
    if (!isAssignmentMode || !submissionId || saving) return;
    
    try {
      setSaving(true);
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textContent,
          wordCount,
          timeSpent,
          sessionData: actions,
          referenceData: referenceActionsList.flat()
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle assignment submission
  const handleSubmitAssignment = async () => {
    if (!analysisResult || !isAssignmentMode || !submissionId || submitting) return;
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textContent: analysisResult.textContent,
          wordCount: analysisResult.wordCount,
          timeSpent: analysisResult.timeSpent,
          sessionData: actions,
          referenceData: referenceActionsList.flat(),
          isSubmitting: true
        }),
      });

      if (response.ok) {
        alert('Assignment submitted successfully! Your work has been analyzed for academic integrity.');
        router.push('/student');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit assignment');
      }
    } catch (error) {
      setError('Error submitting assignment');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Compute average calibration metrics
  const avgCalibration = calibrationMetrics.length > 0
    ? Object.entries(calibrationMetrics[0]).reduce((acc, [key]) => {
        const values = calibrationMetrics.map(m => m[key]);
        acc[key] = values.reduce((a, b) => a + b, 0) / values.length;
        return acc;
      }, {} as Record<string, number>)
    : null;

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <Link href="/student" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
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
              <Link href="/" className="text-2xl font-bold text-blue-600">TRACE</Link>
              <span className="ml-4 text-gray-600 dark:text-gray-300">
                {isAssignmentMode ? 'Assignment Editor' : 'Practice Editor'}
              </span>
            </div>
            <nav className="flex space-x-4">
              {isAssignmentMode ? (
                <>
                  <Link
                    href="/student"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Back to Dashboard
                  </Link>
                  <UserDropdown />
                </>
              ) : (
                <>
                  <Link
                    href="/student"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Student Portal
                  </Link>
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Home
                  </Link>
                  <UserDropdown />
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Header */}
        {isAssignmentMode && assignment && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {assignment.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {assignment.description}
            </p>
            {assignment.instructions && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Instructions:</h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">{assignment.instructions}</p>
              </div>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <span>Due: {formatDate(assignment.dueDate)}</span>
              {assignment.estimatedTime && (
                <>
                  <span>•</span>
                  <span>Estimated: {assignment.estimatedTime} minutes</span>
                </>
              )}
              {assignment.minWords && assignment.maxWords && (
                <>
                  <span>•</span>
                  <span>Length: {assignment.minWords} - {assignment.maxWords} words</span>
                </>
              )}
              <span>•</span>
              <span className={`${isOverdue(assignment.dueDate) ? 'text-red-600' : 'text-blue-600'} dark:text-blue-400`}>
                {isOverdue(assignment.dueDate) ? 'OVERDUE' : 'Monitoring Active'}
              </span>
              {saving && (
                <>
                  <span>•</span>
                  <span className="text-green-600">Saving...</span>
                </>
              )}
            </div>
          </div>
        )}

        {!isAssignmentMode && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              TRACE - Practice Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Practice with the behavior tracking system before starting assignments.
            </p>
          </div>
        )}

        {/* Workflow Steps Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${activeTab === 'calibration' ? 'text-blue-600' : referenceActionsList.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === 'calibration' ? 'bg-blue-100 text-blue-600' : referenceActionsList.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Calibration</span>
            </div>
            <div className={`h-px w-16 ${referenceActionsList.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${activeTab === 'editor' ? 'text-blue-600' : referenceActionsList.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === 'editor' ? 'bg-blue-100 text-blue-600' : referenceActionsList.length > 0 ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-400'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Writing</span>
            </div>
            <div className={`h-px w-16 ${analysisResult ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${activeTab === 'analysis' ? 'text-blue-600' : analysisResult ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === 'analysis' ? 'bg-blue-100 text-blue-600' : analysisResult ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-400'}`}>
                3
              </div>
              <span className="ml-2 font-medium">{isAssignmentMode ? 'Submit' : 'Analysis'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'calibration' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              onClick={() => setActiveTab('calibration')}
            >
              Calibration
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'editor' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'} ${referenceActionsList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setActiveTab('editor')}
              disabled={referenceActionsList.length === 0}
            >
              {isAssignmentMode ? 'Write Assignment' : 'Editor'}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'analysis' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'} ${!analysisResult ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setActiveTab('analysis')}
              disabled={!analysisResult}
            >
              {isAssignmentMode ? 'Review & Submit' : 'Analysis Results'}
            </button>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === 'calibration' && (
          <div className="space-y-6">
            <Calibration onComplete={handleCalibrationComplete} userId={userId} />
            {referenceActionsList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Calibration Samples ({referenceActionsList.length})</h3>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
                  onClick={() => setCalibrationComplete(false)}
                >
                  Add Another Calibration Sample
                </button>
                {avgCalibration && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Average Calibration Metrics</h4>
                    <ul className="text-sm space-y-1">
                      {Object.entries(avgCalibration).map(([key, value]) => (
                        <li key={key}><b>{key}:</b> {typeof value === 'number' ? value.toFixed(2) : JSON.stringify(value)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'editor' && referenceActionsList.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Editor 
                referenceActions={referenceActionsList.flat()}
                onAnalyze={handleAnalysisResults}
                userId={userId}
                assignmentMode={isAssignmentMode}
                onSave={saveProgress}
                initialContent={submission?.textContent}
                assignment={assignment}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Monitoring Status</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Actions Recorded:</span>
                    <span className="font-medium">{actions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calibration Samples:</span>
                    <span className="font-medium">{referenceActionsList.length}</span>
                  </div>
                  {isAssignmentMode && assignment && (
                    <>
                      <div className="flex justify-between">
                        <span>Word Limit:</span>
                        <span className="font-medium">
                          {assignment.minWords && assignment.maxWords 
                            ? `${assignment.minWords} - ${assignment.maxWords}`
                            : 'No limit'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Remaining:</span>
                        <span className={`font-medium ${isOverdue(assignment.dueDate) ? 'text-red-600' : ''}`}>
                          {isOverdue(assignment.dueDate) ? 'OVERDUE' : formatDate(assignment.dueDate)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-6 space-y-2">
                  <button 
                    onClick={() => setShowActions(!showActions)}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {showActions ? 'Hide' : 'Show'} Action Log
                  </button>
                  <button 
                    onClick={clearActions}
                    className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Clear Actions
                  </button>
                </div>

                {showActions && (
                  <div className="mt-4 actions-log h-[300px] overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded border">
                    {actions.length === 0 ? (
                      <p className="text-gray-500">No actions recorded yet. Start typing in the editor.</p>
                    ) : (
                      <ul className="space-y-2">
                        {actions.map((action, index) => (
                          <li key={index} className="text-xs border-b pb-1">
                            <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1 rounded mr-2">
                              {new Date(action.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit', fractionalSecondDigits: 3})}
                            </span>
                            <span className={`inline-block w-12 ${getActionColor(action.type)}`}>
                              {action.type}
                            </span>
                            {action.content && <span className="ml-2">{truncate(action.content, 20)}</span>}
                            {action.pauseDuration && (
                              <span className="ml-2 text-yellow-600">
                                ({(action.pauseDuration / 1000).toFixed(1)}s)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && analysisResult && (
          <div className="space-y-6">
            <AnalysisDashboard 
              result={analysisResult} 
              textContent={analysisResult.textContent}
              submissionInfo={isAssignmentMode && assignment ? {
                assignmentTitle: assignment.title,
                wordCount: analysisResult.wordCount,
                timeSpent: analysisResult.timeSpent
              } : undefined}
            />
            {isAssignmentMode && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Submit Assignment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your work has been analyzed for academic integrity. Review the results above and submit when ready.
                </p>
                {assignment && isOverdue(assignment.dueDate) && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      ⚠️ This assignment is overdue. You may still submit, but it will be marked as late.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSubmitAssignment}
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function getActionColor(type: string): string {
  switch (type) {
    case 'insert': 
      return 'text-green-600';
    case 'delete': 
      return 'text-red-600';
    case 'cursor': 
      return 'text-blue-600';
    case 'pause': 
      return 'text-yellow-600';
    case 'selection': 
      return 'text-purple-600';
    default: 
      return 'text-gray-600';
  }
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
} 