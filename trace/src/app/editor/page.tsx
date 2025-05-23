'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Editor from '@/components/Editor';
import Calibration from '@/components/Calibration';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import { useEditorStore } from '@/store/editorStore';

export default function EditorPage() {
  const { actions, clearActions } = useEditorStore();
  const [showActions, setShowActions] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [referenceActionsList, setReferenceActionsList] = useState<any[][]>([]); // Multiple calibration samples
  const [userId] = useState<string>(`user_${Date.now().toString()}`);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'calibration'>('calibration');
  const [calibrationMetrics, setCalibrationMetrics] = useState<any[]>([]);
  
  // Assignment context from URL parameters
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const assignmentTitle = searchParams.get('title');
  const isAssignmentMode = !!assignmentId;

  // Handle completion of calibration
  const handleCalibrationComplete = (actions: any[]) => {
    setReferenceActionsList(prev => [...prev, actions]);
    setCalibrationComplete(true);
    // Optionally, fetch metrics for this calibration
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actions }),
    })
      .then(res => res.json())
      .then(data => setCalibrationMetrics(prev => [...prev, data.metrics]));
      
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

  // Handle assignment submission
  const handleSubmitAssignment = async () => {
    if (!analysisResult || !isAssignmentMode) return;
    
    // Here you would typically save the submission to a database
    // For now, we'll simulate the submission
    alert('Assignment submitted successfully! Your work has been analyzed for academic integrity.');
    
    // Redirect back to student dashboard
    window.location.href = '/student';
  };

  // Compute average calibration metrics
  const avgCalibration = calibrationMetrics.length > 0
    ? Object.entries(calibrationMetrics[0]).reduce((acc, [key]) => {
        const values = calibrationMetrics.map(m => m[key]);
        acc[key] = values.reduce((a, b) => a + b, 0) / values.length;
        return acc;
      }, {} as Record<string, number>)
    : null;

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
                <Link
                  href="/student"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Back to Dashboard
                </Link>
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
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assignment Header */}
        {isAssignmentMode && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {assignmentTitle || 'Assignment'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <span>Assignment ID: {assignmentId}</span>
              <span>•</span>
              <span>Status: In Progress</span>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400">Monitoring Active</span>
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
              <span className="ml-2 font-medium">Analysis</span>
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
              Analysis Results
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
                referenceActions={referenceActionsList.flat()} // Use all calibration samples
                onAnalyze={handleAnalysisResults}
                userId={userId}
                assignmentMode={isAssignmentMode}
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
            <AnalysisDashboard result={analysisResult} />
            {isAssignmentMode && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Submit Assignment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Your work has been analyzed for academic integrity. Review the results above and submit when ready.
                </p>
                <button
                  onClick={handleSubmitAssignment}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Submit Assignment
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