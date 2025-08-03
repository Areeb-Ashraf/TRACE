import React from 'react';

interface StudentReviewProps {
  textContent: string;
  submissionInfo: {
    assignmentTitle: string;
    wordCount: number;
    timeSpent: number;
    submittedAt?: string;
  };
}

const StudentReview = ({ textContent, submissionInfo }: StudentReviewProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Assignment Submitted Successfully!</h2>
        <p className="text-gray-600 dark:text-gray-300">Review your submission below</p>
      </div>

      {/* Submission Summary */}
      <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg border-l-4 border-green-500">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">
            Assignment Successfully Submitted
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Assignment</div>
            <div className="font-semibold text-gray-900 dark:text-white">{submissionInfo.assignmentTitle}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Word Count</div>
            <div className="font-semibold text-gray-900 dark:text-white">{submissionInfo.wordCount} words</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            <div className="font-semibold text-gray-900 dark:text-white">{formatTime(submissionInfo.timeSpent)}</div>
          </div>
        </div>
        {submissionInfo.submittedAt && (
          <div className="mt-4 text-sm text-green-600 dark:text-green-400">
            Submitted on {formatDate(submissionInfo.submittedAt)}
          </div>
        )}
      </div>

      {/* Academic Integrity Notice */}
      <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
              Academic Integrity Analysis Complete
            </h4>
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Your submission has been automatically analyzed for academic integrity using advanced behavior tracking 
              and AI content detection. This analysis helps ensure the authenticity of your work and maintains 
              academic standards. Your professor will review both your submission and the analysis results.
            </p>
          </div>
        </div>
      </div>

      {/* Essay Content Review */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Your Submission
        </h3>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border">
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
              {textContent}
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What happens next?</h4>
        <ul className="space-y-2 text-gray-600 dark:text-gray-300">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Your submission has been saved and submitted to your professor
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Academic integrity analysis has been completed
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Your professor will review and grade your submission
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            You'll receive your grade and feedback once grading is complete
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StudentReview; 