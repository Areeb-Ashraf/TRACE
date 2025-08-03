'use client';

import React from 'react';

interface AssignmentDetails {
  title: string;
  description: string;
  instructions?: string;
  estimatedTime?: number;
  minWords?: number;
  maxWords?: number;
  rubric?: {
    criteria: Array<{
      name: string;
      excellent: string;
      good: string;
      satisfactory: string;
      needsImprovement: string;
      points: number;
    }>;
    totalPoints: number;
  };
  resources?: string[];
  tips?: string[];
  extensions?: string[];
}

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentDetails;
}

export default function AssignmentDetailsModal({ isOpen, onClose, assignment }: AssignmentDetailsModalProps) {
  if (!isOpen) return null;

  // Parse instructions to handle both string and array formats
  const parseInstructions = (instructions?: string) => {
    if (!instructions) return null;
    
    // Check if it's a JSON array string
    try {
      const parsed = JSON.parse(instructions);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, check if it contains numbered steps
      const lines = instructions.split('\n').filter(line => line.trim());
      const hasNumberedSteps = lines.some(line => /^\d+\./.test(line.trim()));
      
      if (hasNumberedSteps) {
        return lines;
      }
    }
    
    return null;
  };

  const instructionSteps = parseInstructions(assignment.instructions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {assignment.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {assignment.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {assignment.estimatedTime && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Time:</span>
                  <p className="text-gray-900 dark:text-white">{assignment.estimatedTime} minutes</p>
                </div>
              )}
              {assignment.minWords && assignment.maxWords && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Word Count:</span>
                  <p className="text-gray-900 dark:text-white">{assignment.minWords} - {assignment.maxWords} words</p>
                </div>
              )}
              {assignment.rubric && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Points:</span>
                  <p className="text-gray-900 dark:text-white">{assignment.rubric.totalPoints}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {assignment.instructions && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  {instructionSteps ? (
                    <ol className="list-decimal list-inside space-y-2">
                      {instructionSteps.map((step, index) => (
                        <li key={index} className="text-blue-900 dark:text-blue-100">
                          {typeof step === 'string' ? step.replace(/^\d+\.\s*/, '') : step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                      {assignment.instructions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grading Rubric */}
            {assignment.rubric && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Grading Rubric</h3>
                <div className="space-y-3">
                  {assignment.rubric.criteria.map((criterion, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                        {criterion.name} ({criterion.points} points)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="font-medium text-green-600">Excellent:</span>
                          <p className="text-gray-700 dark:text-gray-300">{criterion.excellent}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-600">Good:</span>
                          <p className="text-gray-700 dark:text-gray-300">{criterion.good}</p>
                        </div>
                        <div>
                          <span className="font-medium text-yellow-600">Satisfactory:</span>
                          <p className="text-gray-700 dark:text-gray-300">{criterion.satisfactory}</p>
                        </div>
                        <div>
                          <span className="font-medium text-red-600">Needs Improvement:</span>
                          <p className="text-gray-700 dark:text-gray-300">{criterion.needsImprovement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources */}
            {assignment.resources && assignment.resources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Required Resources</h3>
                <ul className="list-disc list-inside space-y-1">
                  {assignment.resources.map((resource, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">{resource}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {assignment.tips && assignment.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tips for Success</h3>
                <ul className="list-disc list-inside space-y-1">
                  {assignment.tips.map((tip, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extensions */}
            {assignment.extensions && assignment.extensions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Extension Activities</h3>
                <ul className="list-disc list-inside space-y-1">
                  {assignment.extensions.map((extension, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300">{extension}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 