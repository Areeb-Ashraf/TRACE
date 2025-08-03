'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ProfessorSubmissionView from '@/components/ProfessorSubmissionView';
import QuizCreator from '@/components/QuizCreator';
import QuizAnalysisDashboard from '@/components/QuizAnalysisDashboard';
import AIAssignmentCreator from '@/components/AIAssignmentCreator';
import AILessonCreator from '@/components/AILessonCreator';
import DiscussionBoardCreator from '@/components/DiscussionBoardCreator';
import UserDropdown from '@/components/UserDropdown';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic'; // Force dynamic rendering for this page

interface Class { // New interface for Class
  id: string;
  name: string;
  description?: string;
  professorId: string;
  createdAt: string;
  _count?: {
    students?: number;
    assignments?: number;
    quizzes?: number;
    lessons?: number;
  };
  students?: {
    student: {
      id: string;
      name: string;
      email: string;
    }
    classId: string;
    studentId: string;
  }[]; // Corrected students property to Class interface
}

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
  class: Class; // Add class to Assignment interface
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
  class: Class; // Add class to Quiz interface
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
  class: Class; // Add class to Lesson interface
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
  const [classes, setClasses] = useState<Class[]>([]); // New state for classes
  const [selectedClass, setSelectedClass] = useState<string | null>(null); // New state for selected class
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedQuizSubmission, setSelectedQuizSubmission] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false); // New state for showing create class form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'quizzes' | 'lessons' | 'submissions' | 'ai-creator' | 'lesson-creator' | 'discussion-creator'>('assignments'); // Removed 'classes' since it's now the main view
  const [collapsedAssignmentIds, setCollapsedAssignmentIds] = useState<Set<string>>(new Set());
  const [collapsedQuizIds, setCollapsedQuizIds] = useState<Set<string>>(new Set());
  const [collapsedLessonIds, setCollapsedLessonIds] = useState<Set<string>>(new Set());
  const [assignmentSortBy, setAssignmentSortBy] = useState<'dueDate' | 'status' | 'className' | 'none'>('none'); // Added 'className'
  const [quizSortBy, setQuizSortBy] = useState<'dueDate' | 'status' | 'className' | 'none'>('none'); // Added 'className'
  const [lessonSortBy, setLessonSortBy] = useState<'createdAt' | 'status' | 'className' | 'none'>('none'); // Added 'className'

  const [allStudents, setAllStudents] = useState<any[]>([]); // New state for all students
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false); // State for modal visibility
  const [currentClassToManage, setCurrentClassToManage] = useState<Class | null>(null); // State for the class being managed

  // Callback for when a lesson is created via AI Lesson Creator
  const handleLessonCreated = (newLesson: Lesson) => {
    setLessons((prevLessons) => [newLesson, ...prevLessons]); // Add new lesson to state immediately
    setActiveTab('lessons'); // Automatically switch to lessons tab after creation
    fetchLessons(); // Re-fetch lessons in background for consistency
  };

  // Form data for creating assignments
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    estimatedTime: '',
    maxWords: '',
    minWords: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    classId: '' // New field for classId
  });

  // Form data for creating classes
  const [classFormData, setClassFormData] = useState({
    name: '',
    description: ''
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

    fetchClasses(); // Fetch classes first
    fetchAllStudents(); // Fetch all students
  }, [session, status, router]);

  // Fetch assignments, quizzes, and lessons when selectedClass changes
  useEffect(() => {
    if (session?.user?.role === "PROFESSOR" && selectedClass !== null) {
      fetchAssignments();
      fetchQuizzes();
      fetchLessons();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0].id); // Select the first class by default
        }
      } else {
        setError('Failed to fetch classes');
      }
    } catch (error) {
      setError('Error fetching classes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const url = selectedClass ? `/api/assignments?classId=${selectedClass}` : '/api/assignments';
      const response = await fetch(url);
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
      const url = selectedClass ? `/api/quizzes?classId=${selectedClass}` : '/api/quizzes';
      const response = await fetch(url);
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
      const url = selectedClass ? `/api/lessons?classId=${selectedClass}` : '/api/lessons';
      const response = await fetch(url);
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

  const fetchAllStudents = async () => {
    try {
      const response = await fetch('/api/users/students'); // Use the new students endpoint
      if (response.ok) {
        const data = await response.json();
        setAllStudents(data.users);
      } else {
        setError('Failed to fetch students');
      }
    } catch (error) {
      setError('Error fetching students');
      console.error('Error:', error);
    }
  };

  const handleManageStudentsClick = (classItem: Class) => {
    setCurrentClassToManage(classItem);
    setShowManageStudentsModal(true);
  };

  const handleEnrollStudent = async (studentId: string, classId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (response.ok) {
        // Refresh class data to show updated student count
        fetchClasses();
        // Optionally, re-fetch students for the current class management modal if needed
        // This might require re-fetching the class details (which includes students)
        const updatedClassResponse = await fetch(`/api/classes/${classId}`);
        if (updatedClassResponse.ok) {
          const updatedClassData = await updatedClassResponse.json();
          setCurrentClassToManage(updatedClassData); // Update the class in the modal
        }
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to enroll student');
      }
    } catch (error) {
      setError('Error enrolling student');
      console.error('Error:', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string, classId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/unenroll`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      if (response.ok) {
        // Refresh class data to show updated student count
        fetchClasses();
        // Optionally, re-fetch students for the current class management modal if needed
        const updatedClassResponse = await fetch(`/api/classes/${classId}`);
        if (updatedClassResponse.ok) {
          const updatedClassData = await updatedClassResponse.json();
          setCurrentClassToManage(updatedClassData); // Update the class in the modal
        }
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to unenroll student');
      }
    } catch (error) {
      setError('Error unenrolling student');
      console.error('Error:', error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setClasses([...classes, data.class]);
        setSelectedClass(data.class.id); // Select the newly created class
        setShowCreateClass(false);
        setClassFormData({ name: '', description: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create class');
      }
    } catch (error) {
      setError('Error creating class');
      console.error('Error:', error);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClass) {
      setError('Please select a class before creating an assignment.');
      return;
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          classId: selectedClass, // Include selected classId
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
          status: 'DRAFT',
          classId: ''
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

    if (!selectedClass) {
      setError('Please select a class before creating a quiz.');
      return;
    }

    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...quizData, classId: selectedClass }), // Include classId
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

  const handleCollapseAll = () => {
    if (activeTab === 'assignments') {
      setCollapsedAssignmentIds(new Set(assignments.map(a => a.id)));
    } else if (activeTab === 'quizzes') {
      setCollapsedQuizIds(new Set(quizzes.map(q => q.id)));
    } else if (activeTab === 'lessons') {
      setCollapsedLessonIds(new Set(lessons.map(l => l.id)));
    }
  };

  const handleExpandAll = () => {
    if (activeTab === 'assignments') {
      setCollapsedAssignmentIds(new Set());
    } else if (activeTab === 'quizzes') {
      setCollapsedQuizIds(new Set());
    } else if (activeTab === 'lessons') {
      setCollapsedLessonIds(new Set());
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

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  const getSortedAssignments = () => {
    let sortedAssignments = [...assignments];
    if (assignmentSortBy === 'dueDate') {
      sortedAssignments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (assignmentSortBy === 'status') {
      sortedAssignments.sort((a, b) => {
        if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1;
        if (a.status !== 'PUBLISHED' && b.status === 'PUBLISHED') return 1;
        return 0;
      });
    } else if (assignmentSortBy === 'className') { // New: Sort by class name
      sortedAssignments.sort((a, b) => a.class.name.localeCompare(b.class.name));
    }
    return sortedAssignments;
  };

  const getSortedQuizzes = () => {
    let sortedQuizzes = [...quizzes];
    if (quizSortBy === 'dueDate') {
      sortedQuizzes.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (quizSortBy === 'status') {
      sortedQuizzes.sort((a, b) => {
        if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1;
        if (a.status !== 'PUBLISHED' && b.status === 'PUBLISHED') return 1;
        return 0;
      });
    } else if (quizSortBy === 'className') { // New: Sort by class name
      sortedQuizzes.sort((a, b) => a.class.name.localeCompare(b.class.name));
    }
    return sortedQuizzes;
  };

  const getSortedLessons = () => {
    let sortedLessons = [...lessons];
    if (lessonSortBy === 'createdAt') {
      sortedLessons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (lessonSortBy === 'status') {
      sortedLessons.sort((a, b) => {
        if (a.status === 'PUBLISHED' && b.status !== 'PUBLISHED') return -1;
        if (a.status !== 'PUBLISHED' && b.status === 'PUBLISHED') return 1;
        return 0;
      });
    } else if (lessonSortBy === 'className') { // New: Sort by class name
      sortedLessons.sort((a, b) => a.class.name.localeCompare(b.class.name));
    }
    return sortedLessons;
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

  // If no class is selected, show class selection view
  if (!selectedClass) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
        <div className="mb-8">
            <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {session?.user?.name || 'Professor'}!
          </h1>
              <p className="text-gray-600 dark:text-gray-400">Select a class to get started</p>
            </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

          {/* Create New Class Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateClass(true)}
              className="px-6 py-3 bg-[#222e3e] text-white rounded-lg hover:bg-[#1a242f] font-medium transition-colors flex items-center"
              >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Create New Class
              </button>
            </div>

          {/* Create Class Form */}
            {showCreateClass && (
            <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Class</h2>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Class Name *
                    </label>
                    <input
                      type="text"
                      value={classFormData.name}
                      onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#222e3e] focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={classFormData.description}
                      onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                      rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#222e3e] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateClass(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                    className="px-4 py-2 bg-[#222e3e] text-white rounded-lg hover:bg-[#1a242f] font-medium transition-colors"
                    >
                      Create Class
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* Classes List - Horizontal Slabs */}
          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No classes yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first class.</p>
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="px-4 py-2 bg-[#222e3e] text-white rounded-lg hover:bg-[#1a242f] font-medium transition-colors"
                >
                  Create Your First Class
                </button>
              </div>
            ) : (
              // Sort classes alphabetically
              [...classes].sort((a, b) => a.name.localeCompare(b.name)).map((classItem: Class, index: number) => {
                // Get counts for this class
                const classAssignments = assignments.filter(a => a.class?.id === classItem.id);
                const classQuizzes = quizzes.filter(q => q.class?.id === classItem.id);
                const classLessons = lessons.filter(l => l.class?.id === classItem.id);
                  
                  return (
                  <div
                    key={classItem.id}
                    onClick={() => setSelectedClass(classItem.id)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    style={{ height: '120px' }} // Make them as tall as they are wide-ish
                  >
                    <div className="flex items-center h-full p-6">
                      {/* Class Icon/Picture - Left */}
                      <div className="flex-shrink-0 mr-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#222e3e] to-[#1a242f] rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                        </div>
                        </div>
                        
                      {/* Class Name - Center */}
                      <div className="flex-grow mr-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-[#222e3e] dark:group-hover:text-blue-400 transition-colors">
                          {classItem.name}
                        </h3>
                        {classItem.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {classItem.description}
                          </p>
                        )}
                              </div>

                      {/* Counts - Right (Stacked) */}
                      <div className="flex-shrink-0 text-right space-y-1">
                        <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          <span className="font-medium">{classAssignments.length}</span>
                          <span className="ml-1">Assignments</span>
                        </div>
                        <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <span className="font-medium">{classQuizzes.length}</span>
                          <span className="ml-1">Quizzes</span>
                        </div>
                        <div className="flex items-center justify-end text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                          </svg>
                          <span className="font-medium">{classLessons.length}</span>
                          <span className="ml-1">Lessons</span>
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      <div className="flex-shrink-0 ml-4">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-[#222e3e] dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })
                            )}
                          </div>
        </main>
      </div>
    );
  }

  // If a class is selected, show the class management view with tabs
  const selectedClassData = classes.find(c => c.id === selectedClass);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Classes Button */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Classes
          </button>
                            </div>

        {/* Class Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {selectedClassData?.name || 'Class Management'}
            </h1>
            {selectedClassData?.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedClassData.description}</p>
            )}
                          </div>
                        </div>
                        
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
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'assignments'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Essay Assignments ({assignments.length})
                          </button>
                          <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'quizzes'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Quizzes ({quizzes.length})
                          </button>
                          <button
                onClick={() => setActiveTab('lessons')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'lessons'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                Lessons ({lessons.length})
                          </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'submissions'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                </svg>
                All Submissions
              </button>
              <button
                onClick={() => setActiveTab('ai-creator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'ai-creator'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v14m-9 0h18l-1 1-17 1z"/>
                </svg>
                AI Assignment Creator
              </button>
              <button
                onClick={() => setActiveTab('lesson-creator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'lesson-creator'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                AI Lesson Creator
              </button>
              <button
                onClick={() => setActiveTab('discussion-creator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'discussion-creator'
                    ? 'border-[#222e3e] text-[#222e3e]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Discussion Boards
              </button>
            </nav>
                        </div>
                      </div>

        {/* Manage Students Modal */}
        {showManageStudentsModal && currentClassToManage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Students for {currentClassToManage.name}</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Enrolled Students ({currentClassToManage._count?.students || 0})</h3>
                {currentClassToManage.students && currentClassToManage.students.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    {currentClassToManage.students.map((enrollment: any) => (
                      <div key={enrollment.student.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-gray-900 dark:text-white">{enrollment.student.name} ({enrollment.student.email})</span>
                        <button
                          onClick={() => handleUnenrollStudent(enrollment.student.id, currentClassToManage.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                          Unenroll
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No students currently enrolled in this class.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Available Students to Enroll ({allStudents.filter(student => !currentClassToManage?.students?.some((s) => s.student.id === student.id)).length})</h3>
                {allStudents.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    {allStudents
                      .filter(student => !currentClassToManage?.students?.some((s) => s.student.id === student.id)) // Filter out already enrolled students
                      .map((student) => (
                        <div key={student.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                          <span className="text-gray-900 dark:text-white">{student.name} ({student.email})</span>
                          <button
                            onClick={() => handleEnrollStudent(student.id, currentClassToManage.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                          >
                            Enroll
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">No other students available to enroll.</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowManageStudentsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Essay Assignments</h2>
              <div className="flex items-center space-x-2">
                <div className="relative flex items-center space-x-2">
                  <select
                    value={assignmentSortBy}
                    onChange={(e) => setAssignmentSortBy(e.target.value as 'dueDate' | 'status' | 'className' | 'none')}
                    className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 text-sm"
                  >
                    <option value="none">Sort By</option>
                    <option value="dueDate">Due Date</option>
                    <option value="status">Status</option>
                    <option value="className">Class Name</option> {/* New option */}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                  </div>
                  <button
                    onClick={handleExpandAll}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  + Create Assignment
                </button>
              </div>
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
                    {/* New: Class Selection for Assignments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Assign to Class *
                      </label>
                      <select
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Select a class</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
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
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedAssignments().length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No essay assignments available at the moment. Click "Create Assignment" to get started.
                </div>
              ) : (
                getSortedAssignments().map((assignment: Assignment) => {
                  const isCollapsed = collapsedAssignmentIds.has(assignment.id);

                  const toggleCollapse = () => {
                    setCollapsedAssignmentIds((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(assignment.id)) {
                        newSet.delete(assignment.id);
                      } else {
                        newSet.add(assignment.id);
                      }
                      return newSet;
                    });
                  };
                  
                  return (
                    <div key={assignment.id} className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between cursor-pointer" onClick={toggleCollapse}>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {assignment.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                            {/* New: Display class name */}
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {assignment.class.name}
                            </span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <div className="mt-4">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">{assignment.description}</p>
                            {assignment.instructions && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <div className="flex items-start">
                                  <span className="font-medium mr-2">Instructions:</span>
                                  <div className="flex-1">
                                    {(() => {
                                      // Check if instructions contain numbered steps
                                      const lines = assignment.instructions.split('\n').filter((line: string) => line.trim());
                                      const hasNumberedSteps = lines.some((line: string) => /^\d+\./.test(line.trim()));
                                      
                                      if (hasNumberedSteps) {
                                        return (
                                          <ol className="list-decimal list-inside space-y-1">
                                            {lines.map((line: string, index: number) => (
                                              <li key={index} className="text-gray-500 dark:text-gray-400">
                                                {line.replace(/^\d+\.\s*/, '')}
                                              </li>
                                            ))}
                                          </ol>
                                        );
                                      }
                                      
                                      return (
                                        <span className="italic">{assignment.instructions}</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Due: {formatDate(assignment.dueDate)}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Submissions: {assignment._count.submissions}
                              </div>
                              {assignment.estimatedTime && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  Estimated: {assignment.estimatedTime} minutes
                                </div>
                              )}
                              {assignment.maxWords && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  Max Words: {assignment.maxWords}
                                </div>
                              )}
                            </div>
                            
                            {/* Show submission details if graded */}
                            {assignment.submissions.length > 0 && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Submissions</h4>
                                <div className="space-y-2">
                                  {assignment.submissions.slice(0, 3).map((submission: Submission) => (
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
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lessons</h2>
              <div className="relative flex items-center space-x-2">
                <select
                  value={lessonSortBy}
                  onChange={(e) => setLessonSortBy(e.target.value as 'createdAt' | 'status' | 'className' | 'none')}
                  className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 text-sm"
                >
                  <option value="none">Sort By</option>
                  <option value="createdAt">Creation Date</option>
                  <option value="status">Status</option>
                  <option value="className">Class Name</option> {/* New option */}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                </div>
                <button
                  onClick={handleExpandAll}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={handleCollapseAll}
                  className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Lessons List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedLessons().length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No lessons created yet. Use the "AI Lesson Creator" to get started.
                </div>
              ) : (
                getSortedLessons().map((lesson: Lesson) => {
                  const isCollapsed = collapsedLessonIds.has(lesson.id);

                  const toggleCollapse = () => {
                    setCollapsedLessonIds((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(lesson.id)) {
                        newSet.delete(lesson.id);
                      } else {
                        newSet.add(lesson.id);
                      }
                      return newSet;
                    });
                  };

                  return (
                    <div key={lesson.id} className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between cursor-pointer" onClick={toggleCollapse}>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {lesson.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lesson.status)}`}>
                              {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                            </span>
                            {/* New: Display class name */}
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {lesson.class.name}
                            </span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <div className="mt-4">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">{lesson.description}</p>
                            {lesson.learningObjectives.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Learning Objectives:</h4>
                                <ul className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {lesson.learningObjectives.map((objective: string, index: number) => (
                                    <li key={index}>{objective}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              {lesson.subject && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                  </svg>
                                  Subject: {lesson.subject}
                                </div>
                              )}
                              {lesson.topic && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 2h10l2 2v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z"/>
                                  </svg>
                                  Topic: {lesson.topic}
                                </div>
                              )}
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                Difficulty: {lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
                              </div>
                              {lesson.estimatedTime && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  Duration: {lesson.estimatedTime} minutes
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quizzes</h2>
              <div className="flex items-center space-x-2">
                <div className="relative flex items-center space-x-2">
                  <select
                    value={quizSortBy}
                    onChange={(e) => setQuizSortBy(e.target.value as 'dueDate' | 'status' | 'className' | 'none')}
                    className="block appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500 text-sm"
                  >
                    <option value="none">Sort By</option>
                    <option value="dueDate">Due Date</option>
                    <option value="status">Status</option>
                    <option value="className">Class Name</option> {/* New option */}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                  </div>
                  <button
                    onClick={handleExpandAll}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateQuiz(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  + Create Quiz
                </button>
              </div>
            </div>

            {/* Quizzes List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedQuizzes().length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No quizzes created yet. Click "Create Quiz" to get started.
                </div>
              ) : (
                getSortedQuizzes().map((quiz: Quiz) => {
                  const isCollapsed = collapsedQuizIds.has(quiz.id);

                  const toggleCollapse = () => {
                    setCollapsedQuizIds((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(quiz.id)) {
                        newSet.delete(quiz.id);
                      } else {
                        newSet.add(quiz.id);
                      }
                      return newSet;
                    });
                  };

                  return (
                    <div key={quiz.id} className="p-6">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between cursor-pointer" onClick={toggleCollapse}>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {quiz.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                              {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                            </span>
                            {/* New: Display class name */}
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {quiz.class.name}
                            </span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        {!isCollapsed && (
                          <div className="mt-4">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">{quiz.description}</p>
                            {quiz.instructions && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <div className="flex items-start">
                                  <span className="font-medium mr-2">Instructions:</span>
                                  <div className="flex-1">
                                    {(() => {
                                      // Check if instructions contain numbered steps
                                      const lines = quiz.instructions.split('\n').filter((line: string) => line.trim());
                                      const hasNumberedSteps = lines.some((line: string) => /^\d+\./.test(line.trim()));
                                      
                                      if (hasNumberedSteps) {
                                        return (
                                          <ol className="list-decimal list-inside space-y-1">
                                            {lines.map((line: string, index: number) => (
                                              <li key={index} className="text-gray-500 dark:text-gray-400">
                                                {line.replace(/^\d+\.\s*/, '')}
                                              </li>
                                            ))}
                                          </ol>
                                        );
                                      }
                                      
                                      return (
                                        <span className="italic">{quiz.instructions}</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                Due: {formatDate(quiz.dueDate)}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                Questions: {quiz.questions?.length || 0}
                              </div>
                              {quiz.estimatedTime && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  Estimated: {quiz.estimatedTime} minutes
                                </div>
                              )}
                              {quiz.timeLimit && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                  Time Limit: {quiz.timeLimit} minutes
                                </div>
                              )}
                            </div>
                            
                            {/* Show submission details if graded */}
                            {quiz.submissions.length > 0 && (
                              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Recent Submissions</h4>
                                <div className="space-y-2">
                                  {quiz.submissions.slice(0, 3).map((submission: QuizSubmission) => (
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
                        )}
                      </div>
                    </div>
                  );
                })
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
                    assignment.submissions.map((submission: Submission) => (
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
                    quiz.submissions.map((submission: QuizSubmission) => (
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

        {/* AI Assignment Creator Tab */}
        {activeTab === 'ai-creator' && (
          <div>
            <AIAssignmentCreator />
          </div>
        )}

        {/* AI Lesson Creator Tab */}
        {activeTab === 'lesson-creator' && (
          <div>
            <AILessonCreator onLessonCreated={handleLessonCreated} />
          </div>
        )}

        {/* Discussion Board Creator Tab */}
        {activeTab === 'discussion-creator' && (
          <div>
            <DiscussionBoardCreator />
          </div>
        )}
      </main>
    </div>
  );
} 