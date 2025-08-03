import React from 'react';
import AnalysisDashboard from './AnalysisDashboard';

interface ProfessorSubmissionViewProps {
  submission: {
    id: string;
    textContent?: string;
    wordCount?: number;
    timeSpent?: number;
    submittedAt?: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
    assignment: {
      id: string;
      title: string;
      description: string;
      dueDate: string;
      maxWords?: number;
      minWords?: number;
    };
  };
  analysisResult?: any;
  essayContent?: string;
}

const ProfessorSubmissionView = ({ submission, analysisResult, essayContent }: ProfessorSubmissionViewProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const isOverdue = (submittedAt: string, dueDate: string) => {
    return new Date(submittedAt) > new Date(dueDate);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Submission Review
          </h1>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Submitted
            </span>
            {submission.submittedAt && isOverdue(submission.submittedAt, submission.assignment.dueDate) && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Late Submission
              </span>
            )}
          </div>
        </div>

        {/* Student and Assignment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Student Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{submission.student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">{submission.student.email}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assignment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Assignment:</span>
                <span className="font-medium text-gray-900 dark:text-white">{submission.assignment.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(submission.assignment.dueDate)}
                </span>
              </div>
              {submission.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                  <span className={`font-medium ${isOverdue(submission.submittedAt, submission.assignment.dueDate) ? 'text-red-600' : 'text-green-600'}`}>
                    {formatDate(submission.submittedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Word Count</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {submission.wordCount || 0}
              {submission.assignment.maxWords && (
                <span className="text-sm font-normal text-gray-500">
                  / {submission.assignment.maxWords}
                </span>
              )}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {formatTime(submission.timeSpent || 0)}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
            <div className="text-xl font-bold text-green-600">
              Submitted
            </div>
          </div>
        </div>
      </div>

      {/* Essay Content */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Student Submission
        </h2>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border">
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
              {essayContent || submission.textContent || 'No content available'}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Integrity Analysis */}
      {analysisResult && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Academic Integrity Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Comprehensive analysis of typing behavior, content authenticity, and academic integrity indicators.
            </p>
          </div>
          
          <AnalysisDashboard 
            result={analysisResult} 
            textContent={essayContent || submission.textContent}
            submissionInfo={{
              assignmentTitle: submission.assignment.title,
              wordCount: submission.wordCount || 0,
              timeSpent: submission.timeSpent || 0
            }}
          />
        </div>
      )}

      {/* Grading Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Grading</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter grade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter feedback for the student"
            />
          </div>
        </div>
        <div className="mt-6 flex space-x-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
            Save Grade
          </button>
          <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors">
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessorSubmissionView; 