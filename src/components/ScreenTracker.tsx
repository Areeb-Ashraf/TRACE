import React from 'react';
import { ScreenActivity, ScreenTrackingState } from '@/hooks/useScreenTracker';

interface ScreenTrackerProps {
  trackingState: ScreenTrackingState;
  showDetails?: boolean;
  className?: string;
}

const ScreenTracker: React.FC<ScreenTrackerProps> = ({ 
  trackingState, 
  showDetails = false, 
  className = '' 
}) => {
  const { 
    isWindowFocused, 
    activities, 
    isTracking, 
    suspiciousActivityCount, 
    totalTimeOutOfFocus, 
    aiToolDetections,
    extensionAvailable 
  } = trackingState;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSeverityColor = (severity: ScreenActivity['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActivityIcon = (type: ScreenActivity['type']) => {
    switch (type) {
      case 'window_blur': return '👁️‍🗨️';
      case 'window_focus': return '👁️';
      case 'ai_tool_detected': return '🤖';
      case 'suspicious_url': return '🔍';
      case 'copy_paste': return '📋';
      case 'tab_change': return '🔄';
      default: return '⚠️';
    }
  };

  const recentActivities = activities.slice(-5).reverse();
  const criticalActivities = activities.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Screen Activity Monitor</h3>
          <div className="flex items-center space-x-4">
            {/* Extension Status */}
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${extensionAvailable ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-xs text-gray-600">
                {extensionAvailable ? 'Enhanced' : 'Basic'}
              </span>
            </div>
            {/* Tracking Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="px-4 py-3 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${isWindowFocused ? 'text-green-600' : 'text-red-600'}`}>
              {isWindowFocused ? '✓' : '✗'}
            </div>
            <div className="text-xs text-gray-600">Window Focus</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(totalTimeOutOfFocus)}
            </div>
            <div className="text-xs text-gray-600">Time Away</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${aiToolDetections > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {aiToolDetections}
            </div>
            <div className="text-xs text-gray-600">AI Tools</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${suspiciousActivityCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {suspiciousActivityCount}
            </div>
            <div className="text-xs text-gray-600">Alerts</div>
          </div>
        </div>
        
        {/* Monitoring Limitations Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-sm">ℹ️</span>
            <div className="text-xs text-blue-800">
              <strong>Monitoring Scope:</strong> 
              {extensionAvailable ? (
                <span> Enhanced monitoring active with browser extension. Tracking window focus, clipboard activity, typing behavior, and tab navigation including AI tool detection.</span>
              ) : (
                <span> Basic monitoring active. Tracking window focus, clipboard activity, and typing behavior. Due to browser security, cannot monitor other tabs without browser extension. <a href="/extension" className="underline">Install extension</a> for full monitoring.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalActivities.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="text-sm font-medium text-red-600 mb-2">⚠️ Critical Alerts</h4>
          <div className="space-y-2">
            {criticalActivities.slice(-3).map((activity, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                <span className="text-lg">{getActivityIcon(activity.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800">{activity.description}</p>
                  <p className="text-xs text-red-600">{formatTimestamp(activity.timestamp)}</p>
                  {activity.url && (
                    <p className="text-xs text-red-600 truncate">URL: {activity.url}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {showDetails && (
        <div className="px-4 py-3">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className={`p-3 border rounded-lg ${getSeverityColor(activity.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs opacity-75">{formatTimestamp(activity.timestamp)}</p>
                        {activity.duration && (
                          <p className="text-xs opacity-75">Duration: {formatDuration(activity.duration)}</p>
                        )}
                        {activity.url && (
                          <p className="text-xs opacity-75 truncate">URL: {activity.url}</p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(activity.severity)}`}>
                      {activity.severity.toUpperCase()}
                    </span>
                  </div>
                  
                  {activity.evidence && activity.evidence.length > 0 && (
                    <div className="mt-2 pl-6">
                      <details className="text-xs">
                        <summary className="cursor-pointer opacity-75">Evidence</summary>
                        <ul className="mt-1 space-y-1 opacity-75">
                          {activity.evidence.map((evidence, evidenceIndex) => (
                            <li key={evidenceIndex}>• {evidence}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          {isTracking ? (
            <>Monitoring active • {activities.length} total events recorded</>
          ) : (
            'Monitoring inactive'
          )}
        </p>
      </div>
    </div>
  );
};

export default ScreenTracker; 