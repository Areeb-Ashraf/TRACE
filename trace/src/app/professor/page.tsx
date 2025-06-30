'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import ProfessorSubmissionView from '@/components/ProfessorSubmissionView';
import QuizCreator from '@/components/QuizCreator';
import QuizAnalysisDashboard from '@/components/QuizAnalysisDashboard';
import AIAssignmentCreator from '@/components/AIAssignmentCreator';
import AILessonCreator from '@/components/AILessonCreator';
import UserDropdown from '@/components/UserDropdown';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  maxWords?: number;
  minWords?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  submissions: Submission[];
  _count: {
    submissions: number;
  };
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  questions: any[];
  submissions: QuizSubmission[];
  _count: {
    submissions: number;
    questions: number;
  };
}

interface Submission {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  textContent?: string;
  wordCount?: number;
  timeSpent?: number;
  submittedAt?: string;
  grade?: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface QuizSubmission {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  score?: number;
  timeSpent?: number;
  submittedAt?: string;
  grade?: number;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  difficulty: string;
  estimatedTime?: number;
  learningObjectives: string[];
  content: string;
  resources: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sourceType?: string;
  createdAt: string;
  progress: LessonProgress[];
  _count: {
    progress: number;
  };
}

interface LessonProgress {
  id: string;
  status: string;
  timeSpent?: number;
  completedAt?: string;
  lastAccessAt?: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ProfessorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes' | 'lessons' | 'submissions' | 'ai-creator' | 'lesson-creator'>('assignments');

  // Form data for creating assignments
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    estimatedTime: '',
    maxWords: '',
    minWords: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.role !== "PROFESSOR") {
      router.push("/dashboard");
      return;
    }

    fetchAssignments();
    fetchQuizzes();
    fetchLessons();
  }, [session, status, router]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assignments');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments);
      } else {
        setError('Failed to fetch assignments');
      }
    } catch (error) {
      setError('Error fetching assignments');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (error) {
      setError('Error fetching quizzes');
      console.error('Error:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons);
      } else {
        setError('Failed to fetch lessons');
      }
    } catch (error) {
      setError('Error fetching lessons');
      console.error('Error:', error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
          maxWords: formData.maxWords ? parseInt(formData.maxWords) : null,
          minWords: formData.minWords ? parseInt(formData.minWords) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments([data.assignment, ...assignments]);
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          instructions: '',
          dueDate: '',
          estimatedTime: '',
          maxWords: '',
          minWords: '',
          status: 'DRAFT'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create assignment');
      }
    } catch (error) {
      setError('Error creating assignment');
      console.error('Error:', error);
    }
  };

  const handleCreateQuiz = async (quizData: any) => {
    setError('');

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes([data.quiz, ...quizzes]);
        setShowCreateQuiz(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create quiz');
      }
    } catch (error) {
      setError('Error creating quiz');
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchAssignments();
      } else {
        setError('Failed to update assignment status');
      }
    } catch (error) {
      setError('Error updating assignment');
      console.error('Error:', error);
    }
  };

  const handleQuizStatusChange = async (quizId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchQuizzes();
      } else {
        setError('Failed to update quiz status');
      }
    } catch (error) {
      setError('Error updating quiz');
      console.error('Error:', error);
    }
  };

  const handleLessonStatusChange = async (lessonId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchLessons();
      } else {
        setError('Failed to update lesson status');
      }
    } catch (error) {
      setError('Error updating lesson');
      console.error('Error:', error);
    }
  };

  const handleViewSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSubmission(data);
      } else {
        setError('Failed to fetch submission details');
      }
    } catch (error) {
      setError('Error fetching submission');
      console.error('Error:', error);
    }
  };

  const handleViewQuizSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/quiz-submissions/${submissionId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Generate mock analysis data for the quiz submission
        const mockAnalysisData = generateMockQuizAnalysis(data.submission);
        setSelectedQuizSubmission({
          submission: data.submission,
          analysisData: mockAnalysisData
        });
      } else {
        setError('Failed to fetch quiz submission details');
      }
    } catch (error) {
      setError('Error fetching quiz submission');
      console.error('Error:', error);
    }
  };

  // Mock quiz analysis data generator
  const generateMockQuizAnalysis = (submission: any) => {
    const { quiz, answers, student, timeSpent, score, submittedAt, screenTrackings } = submission;
    
    // Parse screen tracking data to get real monitoring information
    let actualActivities = [];
    let realCopyDetections = 0;
    let realPasteDetections = 0;
    let realTabSwitches = 0;
    let realFocusLoss = 0;
    let realAiToolAccess = 0;
    let suspiciousUrls: string[] = [];
    
    if (screenTrackings && screenTrackings.length > 0) {
      try {
        const latestTracking = screenTrackings[0];
        if (latestTracking.activities) {
          actualActivities = JSON.parse(latestTracking.activities);
          
          // Count real activities from screen tracking
          actualActivities.forEach((activity: any) => {
            switch (activity.type) {
              case 'copy_paste':
                if (activity.description?.includes('copied')) realCopyDetections++;
                if (activity.description?.includes('pasted')) realPasteDetections++;
                break;
              case 'window_blur':
              case 'tab_change':
                realTabSwitches++;
                break;
              case 'window_focus':
                realFocusLoss++;
                break;
              case 'ai_tool_detected':
              case 'suspicious_url':
                realAiToolAccess++;
                if (activity.url) suspiciousUrls.push(activity.url);
                break;
            }
          });
        }
      } catch (error) {
        console.log('Error parsing screen tracking data:', error);
      }
    }
    
    // Use real data when available, fallback to minimal random data
    const copyDetections = realCopyDetections || 0;
    const pasteDetections = realPasteDetections || 0;
    const tabSwitches = realTabSwitches || 0;
    const focusLossEvents = realFocusLoss || 0;
    const aiToolAccess = realAiToolAccess || 0;
    
    // Enhanced AI tool detection - check for common AI domains
    const commonAiDomains = ['gemini.google.com', 'chatgpt.com', 'claude.ai', 'perplexity.ai'];
    const detectedAiUrls = suspiciousUrls.filter(url => 
      commonAiDomains.some(domain => url.includes(domain))
    );
    const finalAiToolAccess = Math.max(aiToolAccess, detectedAiUrls.length);
    
    // Calculate risk level based on REAL activity data
    const totalSuspiciousActivity = copyDetections + pasteDetections + tabSwitches + (finalAiToolAccess * 3);
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let riskScore = 0.1;
    
    if (finalAiToolAccess > 0 || totalSuspiciousActivity >= 8) {
      overallRisk = 'critical';
      riskScore = 0.8 + Math.random() * 0.2;
    } else if (totalSuspiciousActivity >= 5) {
      overallRisk = 'high';
      riskScore = 0.6 + Math.random() * 0.2;
    } else if (totalSuspiciousActivity >= 3) {
      overallRisk = 'medium';
      riskScore = 0.3 + Math.random() * 0.3;
    } else {
      riskScore = Math.min(0.3, totalSuspiciousActivity * 0.1);
    }

    // Generate question analysis with CORRECT answer checking
    const questionAnalysis = quiz.questions.map((question: any, index: number) => {
      const answer = answers.find((a: any) => a.questionId === question.id);
      const isCorrect = answer?.isCorrect || false;
      const pointsEarned = answer?.pointsEarned || 0;
      const questionTimeSpent = answer?.timeSpent || Math.floor(Math.random() * 120) + 30;
      
      // Check if this specific question had copy/paste activity
      const questionCopyActivity = actualActivities.filter((activity: any) => 
        activity.description?.includes(`question ${index + 1}`) && 
        activity.description?.includes('copy')
      ).length;
      
      const questionPasteActivity = actualActivities.filter((activity: any) => 
        activity.description?.includes(`question ${index + 1}`) && 
        activity.description?.includes('paste')
      ).length;
      
      return {
        questionId: question.id,
        questionNumber: index + 1,
        timeSpent: questionTimeSpent,
        isCorrect,
        pointsEarned,
        totalPoints: question.points,
        copyActivity: questionCopyActivity,
        pasteActivity: questionPasteActivity
      };
    });

    // Generate risk flags based on REAL data
    const flags = [];
    
    if (copyDetections > 0) {
      flags.push({
        type: 'COPY_DETECTED',
        severity: copyDetections > 2 ? 'high' : 'medium' as 'high' | 'medium',
        description: `${copyDetections} copy events detected during quiz session`,
        evidence: [
          `Total copy events: ${copyDetections}`,
          'Text copied from quiz questions',
          'Potential question sharing or external assistance',
          'Real-time detection from screen tracking'
        ],
        timestamp: Date.now() - Math.random() * 3600000
      });
    }

    if (pasteDetections > 0) {
      flags.push({
        type: 'PASTE_DETECTED',
        severity: 'medium' as 'medium',
        description: `${pasteDetections} paste events detected during quiz session`,
        evidence: [
          `Total paste events: ${pasteDetections}`,
          'External content pasted into quiz interface',
          'Possible use of external resources',
          'Real-time detection from screen tracking'
        ],
        timestamp: Date.now() - Math.random() * 3600000
      });
    }

    if (tabSwitches > 2) {
      flags.push({
        type: 'TAB_SWITCHING',
        severity: tabSwitches > 5 ? 'high' : 'medium' as 'high' | 'medium',
        description: `Tab switching detected (${tabSwitches} events)`,
        evidence: [
          `Total tab switches: ${tabSwitches}`,
          'Navigation away from quiz detected',
          'Potential research or consultation of external resources',
          'Screen tracking monitoring confirmed'
        ],
        timestamp: Date.now() - Math.random() * 3600000
      });
    }

    if (finalAiToolAccess > 0) {
      flags.push({
        type: 'AI_TOOL_ACCESS',
        severity: 'critical' as 'critical',
        description: `AI tool usage detected during quiz (${finalAiToolAccess} instances)`,
        evidence: [
          ...detectedAiUrls.map(url => `Accessed: ${url}`),
          'Real-time browser monitoring detected AI tool usage',
          'Potential automated assistance',
          'Serious violation of academic integrity policy'
        ],
        timestamp: Date.now() - Math.random() * 3600000
      });
    }

    // Generate timeline events from REAL screen tracking data
    const timeline = [];
    let currentTime = Date.now() - (timeSpent * 1000);
    
    timeline.push({
      timestamp: currentTime,
      event: 'Quiz session started with monitoring active',
      type: 'system' as 'system',
      risk: 'low' as 'low'
    });

    // Add real activities from screen tracking
    actualActivities.forEach((activity: any) => {
      timeline.push({
        timestamp: activity.timestamp || (currentTime + Math.random() * timeSpent * 1000),
        event: activity.description || activity.type,
        type: activity.type === 'copy_paste' ? 'monitoring' : 
              activity.type === 'window_blur' || activity.type === 'tab_change' ? 'monitoring' :
              activity.type === 'ai_tool_detected' ? 'monitoring' : 'system' as any,
        risk: activity.severity === 'critical' ? 'high' : 
              activity.severity === 'high' ? 'high' : 
              activity.severity === 'medium' ? 'medium' : 'low' as any,
        details: activity.evidence ? activity.evidence.join(', ') : undefined
      });
    });

    // Add question answer events
    questionAnalysis.forEach((q: any, index: number) => {
      currentTime += q.timeSpent * 1000;
      timeline.push({
        timestamp: currentTime,
        event: `Question ${q.questionNumber} answered`,
        type: 'answer' as 'answer',
        risk: q.isCorrect ? 'low' : 'medium' as 'low' | 'medium',
        details: `${q.isCorrect ? 'Correct' : 'Incorrect'} answer (${q.pointsEarned}/${q.totalPoints} pts)`
      });
    });

    timeline.push({
      timestamp: Date.now(),
      event: 'Quiz submitted successfully',
      type: 'system' as 'system',
      risk: 'low' as 'low'
    });

    return {
      submissionInfo: {
        quizTitle: quiz.title,
        studentName: student.name,
        score: score || 0,
        totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.points, 0),
        timeSpent: timeSpent || 0,
        submittedAt: submittedAt || new Date().toISOString(),
        questionsAnswered: answers.length,
        totalQuestions: quiz.questions.length
      },
      monitoringData: {
        copyDetections,
        pasteDetections,
        tabSwitches,
        windowBlurs: focusLossEvents,
        aiToolAccess: finalAiToolAccess,
        suspiciousUrls: detectedAiUrls,
        totalTimeOutOfFocus: Math.floor(focusLossEvents * 30), // Estimate
        focusLossEvents
      },
      questionAnalysis,
      riskAssessment: {
        overallRisk,
        riskScore,
        flags
      },
      timeline: timeline.sort((a, b) => a.timestamp - b.timestamp)
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'text-gray-600 bg-gray-100';
      case 'PUBLISHED': return 'text-green-600 bg-green-100';
      case 'ARCHIVED': return 'text-red-600 bg-red-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'SUBMITTED': return 'text-purple-600 bg-purple-100';
      case 'GRADED': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show submission view if a submission is selected
  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600 dark:text-gray-300">
                  Submission Review: {selectedSubmission.submission.student.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  ← Back to Dashboard
                </button>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        <main>
          <ProfessorSubmissionView 
            submission={selectedSubmission.submission}
            analysisResult={selectedSubmission.analysisData}
            essayContent={selectedSubmission.essayContent}
          />
        </main>
      </div>
    );
  }

  // Show quiz submission view if a quiz submission is selected
  if (selectedQuizSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600 dark:text-gray-300">
                  Quiz Review: {selectedQuizSubmission.submission.student.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedQuizSubmission(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  ← Back to Dashboard
                </button>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        <main>
          <QuizAnalysisDashboard 
            result={selectedQuizSubmission.analysisData}
          />
        </main>
      </div>
    );
  }

  // Show quiz creator if creating a quiz
  if (showCreateQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
                <span className="ml-4 text-gray-600 dark:text-gray-300">Create New Quiz</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateQuiz(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  ← Back to Dashboard
                </button>
                <UserDropdown />
              </div>
            </div>
          </div>
        </header>
        <main className="py-8">
          <QuizCreator 
            onSave={handleCreateQuiz}
            onCancel={() => setShowCreateQuiz(false)}
            loading={loading}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">TRACE</Link>
              <span className="ml-4 text-gray-600 dark:text-gray-300">Professor Dashboard</span>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Essay Assignments ({assignments.length})
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'quizzes'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quizzes ({quizzes.length})
              </button>
              <button
                onClick={() => setActiveTab('lessons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lessons'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lessons ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Submissions
              </button>
              <button
                onClick={() => setActiveTab('ai-creator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai-creator'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Assignment Creator
              </button>
              <button
                onClick={() => setActiveTab('lesson-creator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lesson-creator'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Lesson Creator
              </button>
            </nav>
          </div>
        </div>

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Essay Assignments</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                + Create Assignment
              </button>
            </div>

            {/* Create Assignment Form */}
            {showCreateForm && (
              <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Assignment</h2>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Due Date *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Time (min)
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Words
                      </label>
                      <input
                        type="number"
                        value={formData.minWords}
                        onChange={(e) => setFormData({ ...formData, minWords: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Words
                      </label>
                      <input
                        type="number"
                        value={formData.maxWords}
                        onChange={(e) => setFormData({ ...formData, maxWords: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      Create Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Assignments List */}
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{assignment.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Due: {formatDate(assignment.dueDate)}</span>
                        <span>Submissions: {assignment._count.submissions}</span>
                        {assignment.estimatedTime && <span>Est. Time: {assignment.estimatedTime}min</span>}
                        {assignment.maxWords && <span>Max Words: {assignment.maxWords}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                      <select
                        value={assignment.status}
                        onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>

                  {assignment.submissions.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Submissions</h4>
                      <div className="space-y-2">
                        {assignment.submissions.slice(0, 3).map((submission) => (
                          <div key={submission.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {submission.student.name}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                              {submission.submittedAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(submission.submittedAt)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleViewSubmission(submission.id)}
                              className="text-sm text-green-600 hover:text-green-800 font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No assignments created yet. Click "Create Assignment" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
              <button
                onClick={() => setShowCreateQuiz(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                + Create Quiz
              </button>
            </div>

            {/* Quizzes List */}
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Due: {formatDate(quiz.dueDate)}</span>
                        <span>Questions: {quiz._count.questions}</span>
                        <span>Submissions: {quiz._count.submissions}</span>
                        {quiz.estimatedTime && <span>Est. Time: {quiz.estimatedTime}min</span>}
                        {quiz.timeLimit && <span>Time Limit: {quiz.timeLimit}min</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(quiz.status)}`}>
                        {quiz.status}
                      </span>
                      <select
                        value={quiz.status}
                        onChange={(e) => handleQuizStatusChange(quiz.id, e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>

                  {quiz.submissions.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Submissions</h4>
                      <div className="space-y-2">
                        {quiz.submissions.slice(0, 3).map((submission) => (
                          <div key={submission.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {submission.student.name}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                              {submission.score !== undefined && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Score: {Math.round(submission.score)}%
                                </span>
                              )}
                              {submission.submittedAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(submission.submittedAt)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleViewQuizSubmission(submission.id)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {quizzes.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No quizzes created yet. Click "Create Quiz" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Submissions</h1>
            
            <div className="space-y-6">
              {/* Essay Submissions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Essay Submissions</h2>
                <div className="space-y-2">
                  {assignments.flatMap(assignment => 
                    assignment.submissions.map(submission => (
                      <div key={submission.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.student.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.title}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {submission.submittedAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(submission.submittedAt)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewSubmission(submission.id)}
                          className="text-sm text-green-600 hover:text-green-800 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quiz Submissions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Submissions</h2>
                <div className="space-y-2">
                  {quizzes.flatMap(quiz => 
                    quiz.submissions.map(submission => (
                      <div key={submission.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.student.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {quiz.title}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {submission.score !== undefined && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {Math.round(submission.score)}%
                            </span>
                          )}
                          {submission.submittedAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(submission.submittedAt)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewQuizSubmission(submission.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lessons</h1>
            </div>

            {/* Lessons List */}
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {lesson.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-2">{lesson.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        {lesson.subject && <span>📘 {lesson.subject}</span>}
                        {lesson.topic && <span>🎯 {lesson.topic}</span>}
                        <span>📊 {lesson.difficulty}</span>
                        <span>👥 {lesson._count.progress} students</span>
                        {lesson.estimatedTime && <span>⏱️ {lesson.estimatedTime}min</span>}
                        <span>📁 {lesson.sourceType || 'manual'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lesson.status)}`}>
                        {lesson.status}
                      </span>
                      <select
                        value={lesson.status}
                        onChange={(e) => handleLessonStatusChange(lesson.id, e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>

                  {lesson.learningObjectives.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">🎯 Learning Objectives</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {lesson.learningObjectives.slice(0, 3).map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                        {lesson.learningObjectives.length > 3 && (
                          <li className="text-gray-500">... and {lesson.learningObjectives.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {lesson.progress.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Student Progress</h4>
                      <div className="space-y-2">
                        {lesson.progress.slice(0, 3).map((progress) => (
                          <div key={progress.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {progress.student.name}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                progress.status === 'COMPLETED' 
                                  ? 'bg-green-100 text-green-800' 
                                  : progress.status === 'IN_PROGRESS'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {progress.status === 'COMPLETED' ? '✅ Complete' : 
                                 progress.status === 'IN_PROGRESS' ? '📚 In Progress' : '⏸️ Not Started'}
                              </span>
                              {progress.timeSpent && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Time: {progress.timeSpent}min
                                </span>
                              )}
                              {progress.lastAccessAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Last access: {formatDate(progress.lastAccessAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {lessons.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No lessons created yet. Use the "AI Lesson Creator" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Assignment Creator Tab */}
        {activeTab === 'ai-creator' && (
          <div>
            <AIAssignmentCreator />
          </div>
        )}

        {/* AI Lesson Creator Tab */}
        {activeTab === 'lesson-creator' && (
          <div>
            <AILessonCreator />
          </div>
        )}
      </main>
    </div>
  );
} 