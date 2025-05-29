import React, { useState, useEffect, useRef } from 'react';
import { useScreenTracker } from '@/hooks/useScreenTracker';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuizQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  question: string;
  points: number;
  order: number;
  explanation?: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  timeLimit?: number;
  allowReview: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: QuizQuestion[];
}

interface QuizSubmission {
  id: string;
  status: string;
  startedAt?: string;
  timeSpent?: number;
  quiz: Quiz;
  answers: any[];
}

interface QuizTakerProps {
  submission: QuizSubmission;
  onSaveAnswers: (answers: any[], timeSpent: number) => void;
  onSubmit: (answers: any[], timeSpent: number) => void;
  onExit: () => void;
  loading?: boolean;
}

const QuizTaker = ({ submission, onSaveAnswers, onSubmit, onExit, loading = false }: QuizTakerProps) => {
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeSpent, setTimeSpent] = useState(submission.timeSpent || 0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [copyDetections, setCopyDetections] = useState<any[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<{ [questionId: string]: number }>({});

  // Screen tracking for quiz monitoring
  const screenTracker = useScreenTracker(true);

  const { quiz } = submission;
  
  // Add null checks to prevent runtime errors
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading quiz...</div>
        </div>
      </div>
    );
  }

  // Additional validation for quiz data structure
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Quiz Error</div>
          <div className="text-gray-600 dark:text-gray-300">This quiz has no questions or invalid data.</div>
          <button
            onClick={onExit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.randomizeQuestions 
    ? [...quiz.questions].sort(() => Math.random() - 0.5)
    : quiz.questions.sort((a, b) => a.order - b.order);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize question start times
  useEffect(() => {
    questions.forEach(question => {
      if (!questionStartTimeRef.current[question.id]) {
        questionStartTimeRef.current[question.id] = Date.now();
      }
    });
  }, [questions]);

  // Timer for tracking time spent
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(elapsed);

      // Update time remaining if there's a time limit
      if (quiz.timeLimit) {
        const remaining = (quiz.timeLimit * 60) - elapsed;
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          handleAutoSubmit();
        }
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quiz.timeLimit]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      handleSaveAnswers();
    }, 30000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [answers, timeSpent]);

  // Copy detection
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 10) {
        const detection = {
          type: 'copy_detected',
          timestamp: Date.now(),
          content: selection.substring(0, 100), // First 100 chars
          questionId: currentQuestion?.id,
          questionIndex: currentQuestionIndex + 1,
          severity: 'high'
        };
        
        setCopyDetections(prev => [...prev, detection]);
        
        // Log to screen tracker - FIXED: use addActivity instead of logActivity
        screenTracker.addActivity({
          type: 'copy_paste',
          severity: 'high',
          description: `Text copied from question ${currentQuestionIndex + 1}`,
          evidence: [
            `Copied text: "${selection.substring(0, 50)}..."`,
            `Question: ${currentQuestion?.question.substring(0, 50)}...`,
            'Potential academic integrity violation'
          ]
        });
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.length > 10) {
        const detection = {
          type: 'paste_detected',
          timestamp: Date.now(),
          content: pastedText.substring(0, 100),
          questionId: currentQuestion?.id,
          questionIndex: currentQuestionIndex + 1,
          severity: 'medium'
        };
        
        setCopyDetections(prev => [...prev, detection]);
        
        // Log to screen tracker - FIXED: use addActivity instead of logActivity
        screenTracker.addActivity({
          type: 'copy_paste',
          severity: 'medium',
          description: `Text pasted into question ${currentQuestionIndex + 1}`,
          evidence: [
            `Pasted text: "${pastedText.substring(0, 50)}..."`,
            'Potential external content usage'
          ]
        });
      }
    };

    // Enhanced visibility change detection for tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from the quiz tab
        screenTracker.addActivity({
          type: 'window_blur',
          severity: 'high',
          description: `Student switched away from quiz during question ${currentQuestionIndex + 1}`,
          evidence: [
            'Quiz tab lost focus',
            'Potential access to external resources',
            `Time: ${new Date().toLocaleTimeString()}`,
            'May indicate AI tool usage or research'
          ]
        });
      } else {
        // User came back to the quiz tab
        screenTracker.addActivity({
          type: 'window_focus',
          severity: 'medium',
          description: `Student returned to quiz on question ${currentQuestionIndex + 1}`,
          evidence: [
            'Quiz tab regained focus',
            'Monitor for potential answer changes',
            `Time: ${new Date().toLocaleTimeString()}`
          ]
        });
      }
    };

    // Keyboard shortcuts that might indicate AI tool usage
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+T (new tab), Ctrl+Tab (tab switching), Alt+Tab (app switching)
      if ((e.ctrlKey && e.key === 't') || 
          (e.ctrlKey && e.key === 'Tab') || 
          (e.altKey && e.key === 'Tab')) {
        screenTracker.addActivity({
          type: 'tab_change',
          severity: 'high',
          description: `Keyboard shortcut detected: ${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.key}`,
          evidence: [
            'Tab switching or new tab keyboard shortcut',
            'High risk of AI tool access',
            `During question ${currentQuestionIndex + 1}`,
            'Immediate flag for review'
          ]
        });
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestion, currentQuestionIndex, screenTracker]);

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSaveAnswers = () => {
    const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
      timeSpent: Math.floor((Date.now() - (questionStartTimeRef.current[questionId] || Date.now())) / 1000)
    }));

    // Save screen tracking data along with answers
    saveScreenTrackingData();
    
    onSaveAnswers(answersArray, timeSpent);
    setLastSaveTime(Date.now());
  };

  const handleAutoSubmit = () => {
    const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
      timeSpent: Math.floor((Date.now() - (questionStartTimeRef.current[questionId] || Date.now())) / 1000)
    }));

    // Save screen tracking data before auto-submit
    saveScreenTrackingData();

    // Stop screen tracking for auto-submit (with error handling)
    try {
      screenTracker.stopTracking();
      console.log('✅ Screen tracking stopped for auto-submit');
    } catch (error) {
      console.warn('⚠️ Error stopping screen tracking during auto-submit (continuing anyway):', error);
    }
    
    // Log auto-submission
    screenTracker.addActivity({
      type: 'window_focus',
      severity: 'medium',
      description: 'Quiz auto-submitted due to time limit - monitoring ended',
      evidence: [
        'Time limit reached',
        'Automatic submission triggered',
        'Screen tracking stopped'
      ]
    });

    onSubmit(answersArray, timeSpent);
  };

  const handleSubmitQuiz = () => {
    const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
      timeSpent: Math.floor((Date.now() - (questionStartTimeRef.current[questionId] || Date.now())) / 1000)
    }));

    // Save final screen tracking data
    saveScreenTrackingData();

    // Stop screen tracking when quiz is submitted (with error handling)
    try {
      screenTracker.stopTracking();
      console.log('✅ Screen tracking stopped for quiz submission');
    } catch (error) {
      console.warn('⚠️ Error stopping screen tracking during submission (continuing anyway):', error);
    }
    
    // Log submission completion
    screenTracker.addActivity({
      type: 'window_focus',
      severity: 'low',
      description: 'Quiz submitted successfully - monitoring ended',
      evidence: [
        'Quiz submission completed',
        'Screen tracking stopped',
        `Total monitoring time: ${Math.floor(timeSpent / 60)} minutes`
      ]
    });

    onSubmit(answersArray, timeSpent);
    setShowSubmitConfirm(false);
  };

  // Handle quiz exit
  const handleExitQuiz = () => {
    // Stop screen tracking when exiting (with error handling)
    try {
      screenTracker.stopTracking();
      console.log('✅ Screen tracking stopped for quiz exit');
    } catch (error) {
      console.warn('⚠️ Error stopping screen tracking during exit (continuing anyway):', error);
    }
    
    // Log quiz exit
    screenTracker.addActivity({
      type: 'window_focus',
      severity: 'low',
      description: 'Quiz exited - monitoring ended',
      evidence: [
        'Student exited quiz',
        'Screen tracking stopped',
        `Session duration: ${Math.floor(timeSpent / 60)} minutes`
      ]
    });

    onExit();
  };

  // Save screen tracking data to the backend
  const saveScreenTrackingData = async () => {
    try {
      const trackingData = {
        quizSubmissionId: submission.id,
        activities: screenTracker.activities,
        summary: {
          totalActivities: screenTracker.activities.length,
          suspiciousActivityCount: screenTracker.suspiciousActivityCount,
          aiToolDetections: screenTracker.aiToolDetections,
          totalTimeOutOfFocus: screenTracker.totalTimeOutOfFocus,
          copyPasteEvents: copyDetections.length,
          sessionDuration: timeSpent,
          riskLevel: screenTracker.suspiciousActivityCount > 5 ? 'high' : 
                    screenTracker.suspiciousActivityCount > 2 ? 'medium' : 'low'
        }
      };

      const response = await fetch('/api/screen-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trackingData),
      });

      if (!response.ok) {
        console.error('Failed to save screen tracking data');
      } else {
        console.log('Screen tracking data saved successfully');
      }
    } catch (error) {
      console.error('Error saving screen tracking data:', error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      questionStartTimeRef.current[questions[currentQuestionIndex + 1].id] = Date.now();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    if (!questionStartTimeRef.current[questions[index].id]) {
      questionStartTimeRef.current[questions[index].id] = Date.now();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isOverdue = () => {
    return new Date() > new Date(quiz.dueDate);
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-300">Loading question...</div>
        </div>
      </div>
    );
  }

  // Validate question options exist
  if (!currentQuestion.options || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Question Error</div>
          <div className="text-gray-600 dark:text-gray-300">
            Question {currentQuestionIndex + 1} has no answer options.
          </div>
          <div className="mt-4 space-x-4">
            {currentQuestionIndex > 0 && (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Previous Question
              </button>
            )}
            {currentQuestionIndex < questions.length - 1 && (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next Question
              </button>
            )}
            <button
              onClick={onExit}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Exit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const questionOptions = quiz.randomizeOptions 
    ? [...currentQuestion.options].sort(() => Math.random() - 0.5)
    : currentQuestion.options.sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Time Display */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Time Spent</div>
                <div className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
                  {formatTime(timeSpent)}
                </div>
              </div>
              
              {timeRemaining !== null && (
                <div className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-300">Time Remaining</div>
                  <div className={`font-mono text-lg font-semibold ${
                    timeRemaining < 300 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatTime(Math.max(0, timeRemaining))}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Answered</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {getAnsweredCount()}/{questions.length}
                </div>
              </div>

              {/* Save Status */}
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last saved: {Math.floor((Date.now() - lastSaveTime) / 1000)}s ago
                </div>
                <button
                  onClick={handleSaveAnswers}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Save Now
                </button>
              </div>

              <button
                onClick={handleExitQuiz}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => goToQuestion(index)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-blue-600 text-white'
                        : answers[question.id]
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {/* Monitoring Status */}
              {copyDetections.length > 0 && (
                <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ Activity Detected
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    {copyDetections.length} copy/paste event(s) logged
                  </div>
                </div>
              )}

              {/* Extension Status Debug Info */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  🔧 Extension Status
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Available: {screenTracker.extensionAvailable ? '✅ Yes' : '❌ No'}<br/>
                  Tracking: {screenTracker.isTracking ? '✅ Active' : '❌ Inactive'}<br/>
                  Activities: {screenTracker.activities.length}<br/>
                  Suspicious: {screenTracker.suspiciousActivityCount}
                </div>
              </div>

              {isOverdue() && (
                <div className="mt-6 p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ Past Due Date
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                    This quiz is overdue but you can still submit
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              {/* Question */}
              <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Question {currentQuestionIndex + 1}
                  </h2>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-8">
                {questionOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      answers[currentQuestion.id] === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={answers[currentQuestion.id] === option.id}
                      onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                      className="mt-1 mr-4 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-800 dark:text-gray-200 leading-relaxed">
                      {option.text}
                    </span>
                  </label>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSaveAnswers}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Save Progress
                  </button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Submit Quiz?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have answered {getAnsweredCount()} out of {questions.length} questions. 
              Once submitted, you cannot make changes to your answers.
            </p>
            
            {copyDetections.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> {copyDetections.length} copy/paste activity detected during this quiz. 
                  This information will be included in your submission for academic integrity review.
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTaker; 