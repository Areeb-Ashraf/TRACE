'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Session {
  filename: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  actionCount: number;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [references, setReferences] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch all sessions
        const sessionsResponse = await fetch('/api/actions?type=session');
        const sessionsData = await sessionsResponse.json();
        
        // Fetch all reference data
        const referencesResponse = await fetch('/api/actions?type=reference');
        const referencesData = await referencesResponse.json();
        
        setSessions(sessionsData.sessions || []);
        setReferences(referencesData.sessions || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setError('Failed to load sessions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const analyzeSession = async (sessionId: string, referenceId: string) => {
    try {
      // Get session data
      const sessionResponse = await fetch(`/api/actions?sessionId=${sessionId}`);
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.actions || sessionData.actions.length === 0) {
        throw new Error('Session data not found or empty');
      }
      
      // Get reference data
      const refResponse = await fetch(`/api/actions?sessionId=${referenceId}`);
      const refData = await refResponse.json();
      
      if (!refData.actions || refData.actions.length === 0) {
        throw new Error('Reference data not found or empty');
      }
      
      // Perform analysis
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actions: sessionData.actions,
          referenceActions: refData.actions
        }),
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Analysis failed');
      }
      
      const analysisResult = await analysisResponse.json();
      
      // Show a more detailed alert with the analysis result
      const isHuman = analysisResult.isHuman;
      const confidence = Math.round(analysisResult.confidenceScore * 100);
      const anomalies = analysisResult.anomalies.length > 0 
        ? `\nAnomalies detected: ${analysisResult.anomalies.join(', ')}` 
        : '';
      
      alert(
        `Analysis result: ${isHuman ? 'Human' : 'Non-human'} typing detected with ${confidence}% confidence.\n` +
        `Typing speed: ${Math.round(analysisResult.metrics.averageTypingSpeed)} CPM\n` +
        `Deletion rate: ${(analysisResult.metrics.deletionRate * 100).toFixed(1)}%\n` +
        `Rhythm consistency: ${(analysisResult.metrics.rhythmConsistency * 100).toFixed(1)}%${anomalies}`
      );
      
    } catch (error) {
      console.error('Error analyzing session:', error);
      alert('Failed to analyze session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">TRACE Dashboard</h1>
        <Link 
          href="/editor"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Session
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner border-4 border-gray-300 border-t-blue-600 rounded-full w-12 h-12 animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Reference Data */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Calibration Data</h2>
            {references.length === 0 ? (
              <p className="text-gray-500">No calibration data available. Complete a calibration session first.</p>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {references.map((reference) => (
                      <tr key={reference.sessionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reference.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(reference.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reference.actionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Sessions */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Typing Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No sessions available. Complete a typing session first.</p>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.sessionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(session.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.actionCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {references.length > 0 && (
                            <select 
                              className="mr-2 border rounded py-1 px-2"
                              onChange={(e) => {
                                if (e.target.value) {
                                  analyzeSession(session.sessionId, e.target.value);
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Compare with...</option>
                              {references.map((ref) => (
                                <option key={ref.sessionId} value={ref.sessionId}>
                                  {ref.userId} ({formatDate(ref.timestamp)})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
} 