import React from 'react';

interface QuizAnalysisResult {
  submissionInfo: {
    quizTitle: string;
    studentName: string;
    score: number;
    totalPoints: number;
    timeSpent: number;
    submittedAt: string;
    questionsAnswered: number;
    totalQuestions: number;
  };
  monitoringData: {
    copyDetections: number;
    pasteDetections: number;
    tabSwitches: number;
    windowBlurs: number;
    aiToolAccess: number;
    suspiciousUrls: string[];
    totalTimeOutOfFocus: number;
    focusLossEvents: number;
  };
  questionAnalysis: {
    questionId: string;
    questionNumber: number;
    timeSpent: number;
    isCorrect: boolean;
    pointsEarned: number;
    totalPoints: number;
    copyActivity: number;
    pasteActivity: number;
  }[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    flags: {
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      evidence: string[];
      timestamp: number;
    }[];
  };
  timeline: {
    timestamp: number;
    event: string;
    type: 'answer' | 'navigation' | 'monitoring' | 'system';
    risk: 'low' | 'medium' | 'high';
    details?: string;
  }[];
}

interface QuizAnalysisDashboardProps {
  result: QuizAnalysisResult;
}

const QuizAnalysisDashboard = ({ result }: QuizAnalysisDashboardProps) => {
  const {
    submissionInfo,
    monitoringData,
    questionAnalysis,
    riskAssessment,
    timeline
  } = result;

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="quiz-analysis-dashboard max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Analysis Results</h2>
        <p className="text-gray-600 dark:text-gray-300">Academic integrity monitoring and performance analysis</p>
      </div>

      {/* Overall Assessment */}
      <div className={`p-6 rounded-lg border-l-4 ${getRiskLevelColor(riskAssessment.overallRisk)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {riskAssessment.overallRisk === 'low' ? '✓ Low Risk Submission' : 
               riskAssessment.overallRisk === 'medium' ? '⚠ Medium Risk Detected' :
               riskAssessment.overallRisk === 'high' ? '⚠ High Risk Detected' :
               '🚨 Critical Risk Detected'}
            </h3>
            <p className="text-lg mb-2">
              Student: <strong>{submissionInfo.studentName}</strong> | 
              Quiz: <strong>{submissionInfo.quizTitle}</strong>
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span>Risk Score: <strong>{Math.round(riskAssessment.riskScore * 100)}%</strong></span>
              <span>Total Flags: <strong>{riskAssessment.flags.length}</strong></span>
              <span>High Risk Flags: <strong>{riskAssessment.flags.filter(f => f.severity === 'high' || f.severity === 'critical').length}</strong></span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(submissionInfo.score)}`}>
              {Math.round(submissionInfo.score)}%
            </div>
            <div className="text-sm">Quiz Score</div>
            <div className="text-xs text-gray-500">
              {submissionInfo.totalPoints} points
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Quiz Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Score</span>
              <span className={`font-semibold ${getScoreColor(submissionInfo.score)}`}>
                {Math.round(submissionInfo.score)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Questions Answered</span>
              <span className="font-semibold">{submissionInfo.questionsAnswered}/{submissionInfo.totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Time Spent</span>
              <span className="font-semibold">{formatTime(submissionInfo.timeSpent)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Submitted</span>
              <span className="font-semibold text-xs">{formatDate(submissionInfo.submittedAt)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Copy/Paste Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Copy Events</span>
              <span className={`font-semibold ${monitoringData.copyDetections > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monitoringData.copyDetections}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Paste Events</span>
              <span className={`font-semibold ${monitoringData.pasteDetections > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {monitoringData.pasteDetections}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${
                  (monitoringData.copyDetections + monitoringData.pasteDetections) === 0 ? 'bg-green-500' :
                  (monitoringData.copyDetections + monitoringData.pasteDetections) < 3 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, ((monitoringData.copyDetections + monitoringData.pasteDetections) / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Focus & Navigation</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Tab Switches</span>
              <span className={`font-semibold ${monitoringData.tabSwitches > 2 ? 'text-red-600' : monitoringData.tabSwitches > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {monitoringData.tabSwitches}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Focus Loss Events</span>
              <span className={`font-semibold ${monitoringData.focusLossEvents > 3 ? 'text-red-600' : monitoringData.focusLossEvents > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                {monitoringData.focusLossEvents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Time Out of Focus</span>
              <span className={`font-semibold text-xs ${monitoringData.totalTimeOutOfFocus > 60 ? 'text-red-600' : monitoringData.totalTimeOutOfFocus > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                {formatTime(monitoringData.totalTimeOutOfFocus)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">AI Tool Detection</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>AI Tool Access</span>
              <span className={`font-semibold ${monitoringData.aiToolAccess > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monitoringData.aiToolAccess}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Suspicious URLs</span>
              <span className={`font-semibold ${monitoringData.suspiciousUrls.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monitoringData.suspiciousUrls.length}
              </span>
            </div>
            {monitoringData.aiToolAccess > 0 && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900 p-2 rounded">
                🚨 AI tool usage detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {riskAssessment.flags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Risk Flags ({riskAssessment.flags.length})
          </h3>
          
          <div className="space-y-4">
            {riskAssessment.flags.map((flag, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${getRiskLevelColor(flag.severity)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-lg">{flag.type.replace(/_/g, ' ').toUpperCase()}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskLevelColor(flag.severity)}`}>
                    {flag.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{flag.description}</p>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Evidence:</strong>
                  <ul className="list-disc list-inside mt-1 ml-4">
                    {flag.evidence.map((evidence, evidenceIndex) => (
                      <li key={evidenceIndex}>{evidence}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Detected at: {new Date(flag.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Analysis */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-6">Question Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4">Question</th>
                <th className="text-left py-3 px-4">Time Spent</th>
                <th className="text-left py-3 px-4">Score</th>
                <th className="text-left py-3 px-4">Copy Activity</th>
                <th className="text-left py-3 px-4">Paste Activity</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {questionAnalysis.map((question, index) => (
                <tr key={question.questionId} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-4 font-medium">Question {question.questionNumber}</td>
                  <td className="py-3 px-4">{formatTime(question.timeSpent)}</td>
                  <td className="py-3 px-4">
                    <span className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {question.pointsEarned}/{question.totalPoints}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={question.copyActivity > 0 ? 'text-red-600' : 'text-green-600'}>
                      {question.copyActivity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={question.pasteActivity > 0 ? 'text-orange-600' : 'text-green-600'}>
                      {question.pasteActivity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {question.isCorrect ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Correct</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Incorrect</span>
                    )}
                    {(question.copyActivity > 0 || question.pasteActivity > 0) && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Flagged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspicious URLs */}
      {monitoringData.suspiciousUrls.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Suspicious URL Access
          </h3>
          <div className="space-y-2">
            {monitoringData.suspiciousUrls.map((url, index) => (
              <div key={index} className="p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">
                  🚨 {url}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Potential AI tool or academic assistance website
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Session Timeline</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <div className={`w-3 h-3 rounded-full ${
                event.risk === 'high' ? 'bg-red-500' :
                event.risk === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-20">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className={`text-sm px-2 py-1 rounded text-xs ${
                event.type === 'monitoring' ? 'bg-red-100 text-red-800' :
                event.type === 'answer' ? 'bg-blue-100 text-blue-800' :
                event.type === 'navigation' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {event.type}
              </span>
              <span className="text-sm flex-1">{event.event}</span>
              {event.details && (
                <span className="text-xs text-gray-400">{event.details}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizAnalysisDashboard; 