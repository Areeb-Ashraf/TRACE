import React from 'react';

interface DetailedMetrics {
  averageTypingSpeed: number;
  standardDeviationTypingSpeed: number;
  pauseFrequency: number;
  deletionRate: number;
  cursorJumpFrequency: number;
  rhythmConsistency: number;
  burstiness: number;
  dwellTimeVariability: number;
  flightTimeVariability: number;
  backtrackingFrequency: number;
  correctionPatterns: number;
  typingAcceleration: number;
  fatigueIndicators: number;
  consistencyScore: number;
  pausePatterns: {
    shortPauses: number;
    mediumPauses: number;
    longPauses: number;
    averagePauseLength: number;
    pauseDistribution: number[];
  };
  wordsPerMinute: number;
  charactersPerMinute: number;
  revisionsPerWord: number;
}

interface SuspiciousActivity {
  type: 'paste' | 'speed_anomaly' | 'rhythm_anomaly' | 'pause_anomaly' | 'ai_content' | 'behavior_deviation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  confidence: number;
  timestamp?: number;
  affectedContent?: string;
}

interface ReferenceComparison {
  overall: number;
  breakdown: {
    typingSpeed: { similarity: number; deviation: number; explanation: string };
    rhythm: { similarity: number; deviation: number; explanation: string };
    pausePatterns: { similarity: number; deviation: number; explanation: string };
    deletionRate: { similarity: number; deviation: number; explanation: string };
    dwellTime: { similarity: number; deviation: number; explanation: string };
    flightTime: { similarity: number; deviation: number; explanation: string };
  };
  statisticalSignificance: number;
  profileMatchScore: number;
}

interface AnalysisResult {
  isHuman: boolean;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metrics: DetailedMetrics;
  suspiciousActivities: SuspiciousActivity[];
  referenceComparison?: ReferenceComparison;
  aiTextDetection?: {
    isAiGenerated: boolean;
    score: number;
    provider: string;
    error?: string;
  };
  summary: {
    totalFlags: number;
    highRiskFlags: number;
    behaviorScore: number;
    contentScore: number;
    overallAssessment: string;
  };
  timeline: {
    timestamp: number;
    event: string;
    risk: 'low' | 'medium' | 'high';
  }[];
}

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

const AnalysisDashboard = ({ result }: AnalysisDashboardProps) => {
  const { 
    isHuman, 
    confidenceScore, 
    riskLevel, 
    metrics, 
    suspiciousActivities, 
    referenceComparison, 
    aiTextDetection, 
    summary,
    timeline 
  } = result;
  
  const confidencePercentage = Math.round(confidenceScore * 100);
  
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'critical': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="analysis-dashboard max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analysis Results</h2>
        <p className="text-gray-600 dark:text-gray-300">Comprehensive behavioral and content analysis</p>
      </div>

      {/* Overall Assessment */}
      <div className={`p-6 rounded-lg border-l-4 ${getRiskLevelColor(riskLevel)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {isHuman ? '✓ Authentic Work Detected' : '⚠ Suspicious Activity Detected'}
            </h3>
            <p className="text-lg">{summary.overallAssessment}</p>
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <span>Risk Level: <strong className="capitalize">{riskLevel}</strong></span>
              <span>Total Flags: <strong>{summary.totalFlags}</strong></span>
              <span>High Risk Flags: <strong>{summary.highRiskFlags}</strong></span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${isHuman ? 'text-green-600' : 'text-red-600'}`}>
              {confidencePercentage}%
            </div>
            <div className="text-sm">Confidence</div>
          </div>
        </div>
      </div>

      {/* Scores Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Behavior Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Behavior Score</span>
              <span className="font-semibold">{Math.round(summary.behaviorScore * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${summary.behaviorScore > 0.7 ? 'bg-green-500' : summary.behaviorScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${summary.behaviorScore * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Content Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Content Score</span>
              <span className="font-semibold">{Math.round(summary.contentScore * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${summary.contentScore > 0.7 ? 'bg-green-500' : summary.contentScore > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${summary.contentScore * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Detection Results */}
      {aiTextDetection && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">AI Content Detection</h3>
          {aiTextDetection.error ? (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">AI Detection Error</h4>
                  <p className="text-red-700 dark:text-red-300 text-sm">{aiTextDetection.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg ${aiTextDetection.isAiGenerated ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`text-lg font-semibold ${aiTextDetection.isAiGenerated ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
                    {aiTextDetection.isAiGenerated ? 'AI-Generated Content Detected' : 'Human-Written Content'}
                  </h4>
                  <p className={`text-sm ${aiTextDetection.isAiGenerated ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    AI Detection Score: {Math.round(aiTextDetection.score * 100)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Analysis by {aiTextDetection.provider}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suspicious Activities */}
      {suspiciousActivities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Suspicious Activities ({suspiciousActivities.length})</h3>
          <div className="space-y-4">
            {suspiciousActivities.map((activity, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                activity.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900' :
                activity.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900' :
                activity.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900' :
                'border-blue-500 bg-blue-50 dark:bg-blue-900'
              }`}>
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(activity.severity)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{activity.description}</h4>
                      <span className={`px-2 py-1 text-xs rounded uppercase font-semibold ${
                        activity.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        activity.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        activity.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {activity.severity}
                      </span>
                    </div>
                    <div className="mt-2 text-sm space-y-1">
                      {activity.evidence.map((evidence, evidenceIndex) => (
                        <p key={evidenceIndex} className="text-gray-600 dark:text-gray-400">• {evidence}</p>
                      ))}
                    </div>
                    {activity.timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Time: {formatTime(activity.timestamp)}
                      </p>
                    )}
                    {activity.affectedContent && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">View affected content</summary>
                        <p className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 font-mono">
                          {activity.affectedContent.substring(0, 200)}...
                        </p>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Comparison */}
      {referenceComparison && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold mb-4">Calibration Comparison</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Overall similarity to calibration: <strong>{Math.round(referenceComparison.overall * 100)}%</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Statistical significance: <strong>{Math.round(referenceComparison.statisticalSignificance * 100)}%</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(referenceComparison.breakdown).map(([metric, data]) => (
              <div key={metric} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-semibold">{Math.round(data.similarity * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${data.similarity > 0.7 ? 'bg-green-500' : data.similarity > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${data.similarity * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Detailed Typing Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Typing Speed</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.averageTypingSpeed)} CPM</p>
            <p className="text-xs text-gray-500">{Math.round(metrics.wordsPerMinute)} WPM</p>
          </div>
          
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Rhythm Consistency</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.rhythmConsistency * 100)}%</p>
            <p className="text-xs text-gray-500">Keystroke timing</p>
          </div>
          
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Correction Rate</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.deletionRate * 100)}%</p>
            <p className="text-xs text-gray-500">Deletions per keystroke</p>
          </div>
          
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Pause Frequency</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.pauseFrequency * 100)}%</p>
            <p className="text-xs text-gray-500">Actions with pauses</p>
          </div>
          
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Typing Burstiness</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.burstiness * 100)}%</p>
            <p className="text-xs text-gray-500">Burst vs steady typing</p>
          </div>
          
          <div className="metric-card p-4 bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="font-semibold text-sm mb-2">Consistency Score</h4>
            <p className="text-2xl font-bold">{Math.round(metrics.consistencyScore * 100)}%</p>
            <p className="text-xs text-gray-500">Overall pattern stability</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Session Timeline</h3>
        <div className="space-y-2">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <div className={`w-3 h-3 rounded-full ${
                event.risk === 'high' ? 'bg-red-500' :
                event.risk === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-sm text-gray-500">{formatTime(event.timestamp)}</span>
              <span className="text-sm">{event.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard; 