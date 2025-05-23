'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  assignmentTitle: string;
  submissionDate: string;
  analysisResult: {
    isHuman: boolean;
    confidenceScore: number;
    metrics: {
      averageTypingSpeed: number;
      pauseFrequency: number;
      deletionRate: number;
      cursorJumpFrequency: number;
      rhythmConsistency: number;
    };
    anomalies: string[];
    aiTextDetection?: {
      isAiGenerated: boolean;
      score: number;
      provider: string;
    };
  };
  textContent: string;
  wordCount: number;
  timeSpent: number; // in minutes
}

const mockSubmissions: StudentSubmission[] = [
  {
    id: '1',
    studentName: 'John Smith',
    studentId: 'JS001',
    assignmentTitle: 'Essay on Climate Change',
    submissionDate: '2024-01-14T10:30:00Z',
    analysisResult: {
      isHuman: true,
      confidenceScore: 0.82,
      metrics: {
        averageTypingSpeed: 65,
        pauseFrequency: 0.15,
        deletionRate: 0.08,
        cursorJumpFrequency: 0.12,
        rhythmConsistency: 0.7
      },
      anomalies: [],
      aiTextDetection: {
        isAiGenerated: false,
        score: 0.23,
        provider: 'ZeroGPT'
      }
    },
    textContent: 'Climate change represents one of the most pressing challenges of our time...',
    wordCount: 1050,
    timeSpent: 95
  },
  {
    id: '2',
    studentName: 'Sarah Johnson',
    studentId: 'SJ002',
    assignmentTitle: 'Literature Analysis',
    submissionDate: '2024-01-13T14:15:00Z',
    analysisResult: {
      isHuman: false,
      confidenceScore: 0.35,
      metrics: {
        averageTypingSpeed: 220,
        pauseFrequency: 0.02,
        deletionRate: 0.01,
        cursorJumpFrequency: 0.03,
        rhythmConsistency: 0.95
      },
      anomalies: [
        'Unusually high typing speed (220 CPM)',
        'Abnormally few pauses while typing',
        'No corrections or deletions made (unusual for human typing)'
      ],
      aiTextDetection: {
        isAiGenerated: true,
        score: 0.87,
        provider: 'ZeroGPT'
      }
    },
    textContent: 'Harper Lee\'s "To Kill a Mockingbird" masterfully explores themes of racial injustice...',
    wordCount: 1200,
    timeSpent: 25
  },
  {
    id: '3',
    studentName: 'Mike Davis',
    studentId: 'MD003',
    assignmentTitle: 'Historical Research Paper',
    submissionDate: '2024-01-12T09:45:00Z',
    analysisResult: {
      isHuman: true,
      confidenceScore: 0.75,
      metrics: {
        averageTypingSpeed: 45,
        pauseFrequency: 0.25,
        deletionRate: 0.15,
        cursorJumpFrequency: 0.18,
        rhythmConsistency: 0.6
      },
      anomalies: [],
      aiTextDetection: {
        isAiGenerated: false,
        score: 0.18,
        provider: 'ZeroGPT'
      }
    },
    textContent: 'World War I fundamentally altered the political and social landscape of Europe...',
    wordCount: 1500,
    timeSpent: 140
  }
];

export default function ProfessorDashboard() {
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'suspicious' | 'verified'>('all');

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-100';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.7) return 'High Confidence';
    if (score >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const filteredSubmissions = mockSubmissions.filter(submission => {
    if (filterStatus === 'suspicious') return !submission.analysisResult.isHuman;
    if (filterStatus === 'verified') return submission.analysisResult.isHuman;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Analytics
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Academic Integrity Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review student submissions and analyze their authenticity using behavioral patterns.
          </p>
        </div>

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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockSubmissions.length}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Verified Authentic</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockSubmissions.filter(s => s.analysisResult.isHuman).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Flagged Suspicious</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {mockSubmissions.filter(s => !s.analysisResult.isHuman).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((mockSubmissions.reduce((sum, s) => sum + s.analysisResult.confidenceScore, 0) / mockSubmissions.length) * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Submissions' },
              { key: 'suspicious', label: 'Suspicious' },
              { key: 'verified', label: 'Verified' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === tab.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Student Submissions</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {submission.studentName} ({submission.studentId})
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{submission.assignmentTitle}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        submission.analysisResult.isHuman 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {submission.analysisResult.isHuman ? 'Authentic' : 'Suspicious'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getConfidenceColor(submission.analysisResult.confidenceScore)
                      }`}>
                        {getConfidenceLabel(submission.analysisResult.confidenceScore)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                    <p className="font-medium">{formatDate(submission.submissionDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Word Count:</span>
                    <p className="font-medium">{submission.wordCount} words</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Time Spent:</span>
                    <p className="font-medium">{submission.timeSpent} minutes</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                    <p className="font-medium">{Math.round(submission.analysisResult.confidenceScore * 100)}%</p>
                  </div>
                </div>

                {submission.analysisResult.anomalies.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Detected Anomalies:</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {submission.analysisResult.anomalies.map((anomaly, index) => (
                        <li key={index}>• {anomaly}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detailed View Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detailed Analysis: {selectedSubmission.studentName}
                  </h2>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Typing Speed</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedSubmission.analysisResult.metrics.averageTypingSpeed} CPM
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Pause Frequency</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(selectedSubmission.analysisResult.metrics.pauseFrequency * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Deletion Rate</h4>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {(selectedSubmission.analysisResult.metrics.deletionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* AI Detection Results */}
                {selectedSubmission.analysisResult.aiTextDetection && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      AI Text Detection ({selectedSubmission.analysisResult.aiTextDetection.provider})
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200">
                      AI-generated probability: {Math.round(selectedSubmission.analysisResult.aiTextDetection.score * 100)}%
                      {selectedSubmission.analysisResult.aiTextDetection.isAiGenerated && (
                        <span className="ml-2 text-red-600 font-medium">⚠ Likely AI-generated</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Text Content Preview */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Submission Content</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-gray-800 dark:text-gray-200">
                      {selectedSubmission.textContent}
                      {selectedSubmission.textContent.length > 200 && '...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 