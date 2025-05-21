import React from 'react';

interface AnalysisResult {
  isHuman: boolean;
  confidenceScore: number;
  metrics: {
    averageTypingSpeed: number;
    pauseFrequency: number;
    deletionRate: number;
    cursorJumpFrequency: number;
    rhythmConsistency: number;
    pausePatterns: {
      beforeDifficultWords: number;
      atPunctuations: number;
    };
  };
  anomalies: string[];
  referenceComparison?: {
    overall: number;
    typingSpeed: number;
    rhythm: number;
    deletionRate: number;
    pauseFrequency: number;
  };
  aiTextDetection?: {
    isAiGenerated: boolean;
    score: number;
    provider: string;
  };
}

interface AnalysisDashboardProps {
  result: AnalysisResult;
}

const AnalysisDashboard = ({ result }: AnalysisDashboardProps) => {
  const { isHuman, confidenceScore, metrics, anomalies, referenceComparison, aiTextDetection } = result;
  
  // Format confidence score as percentage
  const confidencePercentage = Math.round(confidenceScore * 100);
  
  // Determine result status class
  const getStatusClass = () => {
    if (isHuman) {
      return confidencePercentage > 80 
        ? 'bg-green-100 border-green-500 text-green-700' 
        : 'bg-yellow-100 border-yellow-500 text-yellow-700';
    }
    return 'bg-red-100 border-red-500 text-red-700';
  };
  
  // Generate human-readable analysis results
  const getAnalysisResult = () => {
    if (isHuman) {
      if (confidencePercentage > 80) {
        return 'High confidence that this is authentic human typing behavior.';
      } else if (confidencePercentage > 65) {
        return 'This appears to be human typing, with a good degree of confidence.';
      } else {
        return 'Likely human typing, but with some unusual patterns.';
      }
    } else {
      if (confidencePercentage < 30) {
        return 'This typing behavior is highly inconsistent with human patterns.';
      } else {
        return 'This typing behavior appears to be non-human or artificially generated.';
      }
    }
  };

  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };
  
  return (
    <div className="analysis-dashboard p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
      
      {/* Overall result */}
      <div className={`overall-result p-4 rounded-lg border-l-4 mb-6 ${getStatusClass()}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isHuman ? 'Human Typing Detected' : 'Non-Human Behavior Detected'}
            </h3>
            <p>{getAnalysisResult()}</p>
          </div>
          <div className="confidence-meter text-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isHuman ? "#4CAF50" : "#F44336"}
                  strokeWidth="3"
                  strokeDasharray={`${confidencePercentage}, 100`}
                />
                <text x="18" y="20.5" className="text-lg font-semibold" textAnchor="middle" fill={isHuman ? "#4CAF50" : "#F44336"}>
                  {confidencePercentage}%
                </text>
              </svg>
            </div>
            <div className="text-sm">Confidence</div>
          </div>
        </div>
      </div>
      
      {/* AI Text Detection Results (if available) */}
      {aiTextDetection && (
        <div className="ai-detection mb-6">
          <h3 className="text-lg font-semibold mb-3">AI Content Detection</h3>
          <div className={`p-4 rounded-lg ${aiTextDetection.isAiGenerated ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-lg font-bold ${aiTextDetection.isAiGenerated ? 'text-red-700' : 'text-green-700'}`}>
                  {aiTextDetection.isAiGenerated 
                    ? 'AI-Generated Content Detected' 
                    : 'Likely Human-Written Content'}
                </p>
                <p className="text-sm mt-1">
                  {aiTextDetection.isAiGenerated
                    ? 'The text content appears to have characteristics of AI-generated text.'
                    : 'The text content appears to be written by a human.'}
                </p>
                <p className="text-xs mt-2">
                  Analysis provided by: {aiTextDetection.provider}
                </p>
              </div>
              <div className="ai-score-meter text-center ml-4">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e6e6e6"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={aiTextDetection.isAiGenerated ? "#F44336" : "#4CAF50"}
                      strokeWidth="3"
                      strokeDasharray={`${Math.round(aiTextDetection.score * 100)}, 100`}
                    />
                    <text x="18" y="20.5" className="text-sm font-semibold" textAnchor="middle" fill={aiTextDetection.isAiGenerated ? "#F44336" : "#4CAF50"}>
                      {Math.round(aiTextDetection.score * 100)}%
                    </text>
                  </svg>
                </div>
                <div className="text-xs">AI Detection</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Reference Comparison (if available) */}
      {referenceComparison && (
        <div className="reference-comparison mb-6">
          <h3 className="text-lg font-semibold mb-3">Comparison to Your Calibration</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="mb-3 text-sm text-blue-800">
              This analysis compares your current typing behavior with the calibration sample you provided earlier.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="similarity-metric">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Overall Similarity</span>
                  <span className="text-sm font-semibold">{formatPercentage(referenceComparison.overall)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${referenceComparison.overall * 100}%` }}></div>
                </div>
              </div>
              
              <div className="similarity-metric">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Typing Speed</span>
                  <span className="text-sm font-semibold">{formatPercentage(referenceComparison.typingSpeed)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${referenceComparison.typingSpeed * 100}%` }}></div>
                </div>
              </div>
              
              <div className="similarity-metric">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Typing Rhythm</span>
                  <span className="text-sm font-semibold">{formatPercentage(referenceComparison.rhythm)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${referenceComparison.rhythm * 100}%` }}></div>
                </div>
              </div>
              
              <div className="similarity-metric">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Correction Behavior</span>
                  <span className="text-sm font-semibold">{formatPercentage(referenceComparison.deletionRate)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${referenceComparison.deletionRate * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Metrics */}
      <div className="metrics mb-6">
        <h3 className="text-lg font-semibold mb-4">Typing Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="metric p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Typing Speed</div>
            <div className="text-xl font-semibold">{Math.round(metrics.averageTypingSpeed)} CPM</div>
            <div className="text-xs text-gray-400">Characters per minute</div>
          </div>
          
          <div className="metric p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Rhythm Consistency</div>
            <div className="text-xl font-semibold">{(metrics.rhythmConsistency * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-400">
              {metrics.rhythmConsistency > 0.85 ? 'Very consistent (unusual)' : 
               metrics.rhythmConsistency > 0.6 ? 'Consistent' : 
               metrics.rhythmConsistency > 0.3 ? 'Moderately variable (natural)' : 
               'Highly variable'}
            </div>
          </div>
          
          <div className="metric p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Deletion Rate</div>
            <div className="text-xl font-semibold">{(metrics.deletionRate * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-400">
              {metrics.deletionRate === 0 ? 'No corrections (unusual)' :
               metrics.deletionRate < 0.01 ? 'Very few corrections' :
               metrics.deletionRate < 0.05 ? 'Few corrections' :
               metrics.deletionRate < 0.2 ? 'Normal correction rate' :
               'High correction rate'}
            </div>
          </div>
          
          <div className="metric p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">Pause Frequency</div>
            <div className="text-xl font-semibold">{(metrics.pauseFrequency * 100).toFixed(1)}%</div>
            <div className="text-xs text-gray-400">
              {metrics.pauseFrequency === 0 ? 'No pauses (unusual)' :
               metrics.pauseFrequency < 0.01 ? 'Very few pauses' :
               metrics.pauseFrequency < 0.05 ? 'Few pauses' :
               metrics.pauseFrequency < 0.2 ? 'Normal pause frequency' :
               'High pause frequency'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="anomalies mb-6">
          <h3 className="text-lg font-semibold mb-2">Detected Anomalies</h3>
          <div className="bg-red-50 p-4 rounded-lg">
            <ul className="list-disc pl-5">
              {anomalies.map((anomaly, index) => (
                <li key={index} className="text-red-600 mb-1">{anomaly}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Explanation */}
      <div className="explanation mt-6 p-4 bg-blue-50 rounded text-sm text-blue-800">
        <h4 className="font-semibold mb-2">How This Analysis Works</h4>
        <p className="mb-2">
          This analysis examines your typing patterns including speed, rhythm, pauses, and editing behavior. 
          Human typing typically shows natural variations in rhythm, occasional errors and corrections, 
          and pauses for thinking.
        </p>
        <p>
          {referenceComparison 
            ? "The analysis primarily compares your current typing behavior with your calibration sample, accounting for natural variations in how you type at different times." 
            : "Without a calibration sample, the analysis uses general human typing patterns for comparison. For better results, complete a calibration first."}
            {aiTextDetection && " Additionally, the text content is analyzed for patterns characteristic of AI-generated text."}
        </p>
      </div>
    </div>
  );
};

export default AnalysisDashboard; 