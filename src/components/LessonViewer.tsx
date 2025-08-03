'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

interface LessonSection {
  id: string;
  title: string;
  content: string;
  order: number;
  sectionType: string;
  metadata: {
    keyPoints?: string[];
    examples?: string[];
    checkpointQuestion?: string;
    documentReferences?: string[];
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
  sections: LessonSection[];
  professor: {
    name: string;
    email: string;
  };
  progress?: {
    status: string;
    progressData?: any;
    timeSpent?: number;
    completedAt?: string;
    lastAccessAt?: string;
  }[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface LessonViewerProps {
  lesson: Lesson;
  onProgressUpdate?: (progress: any) => void;
}

export default function LessonViewer({ lesson, onProgressUpdate }: LessonViewerProps) {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [timeSpent, setTimeSpent] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
    // Start tracking time
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [lesson.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Focus chat input when opened
  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [chatOpen]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/chat`);
      const data = await response.json();
      
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    };

    const currentInput = chatInput.trim();
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentInput,
          messages: [...chatMessages, userMessage]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setChatMessages(data.messages);
      } else {
        showError(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      showError('Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSectionComplete = (sectionIndex: number) => {
    const newCompleted = new Set(completedSections);
    newCompleted.add(sectionIndex);
    setCompletedSections(newCompleted);
    
    // Update progress
    updateProgress({
      completedSections: Array.from(newCompleted),
      currentSection: sectionIndex,
      timeSpent: Math.floor(timeSpent / 60) // Convert to minutes
    });
  };

  const updateProgress = async (progressData: any) => {
    try {
      const percentage = Math.round((completedSections.size / Math.max(lesson.sections.length, 1)) * 100);
      const status = completedSections.size === lesson.sections.length ? 'COMPLETED' : 'IN_PROGRESS';
      
      const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressData: {
            ...progressData,
            percentage: percentage,
            completedSections: Array.from(completedSections),
            totalSections: lesson.sections.length
          },
          timeSpent: Math.floor(timeSpent / 60),
          status: status,
          completed: status === 'COMPLETED'
        })
      });

      const data = await response.json();
      
      if (data.success && onProgressUpdate) {
        onProgressUpdate(data.progress);
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const markLessonComplete = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'PUT'
      });

      const data = await response.json();
      
      if (data.success) {
        success('🎉 Congratulations! Lesson completed successfully!');
        if (onProgressUpdate) {
          onProgressUpdate(data.progress);
        }
        
        // Redirect to dashboard lessons tab after a short delay
        setTimeout(() => {
          window.location.href = '/student?tab=lessons';
        }, 2000);
      } else {
        showError(data.error || 'Failed to mark lesson as complete');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      showError('Failed to mark lesson as complete');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                  {lesson.difficulty}
                </span>
              </div>
              <p className="text-gray-600 text-lg mb-2">{lesson.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                {lesson.subject && <span>📘 {lesson.subject}</span>}
                {lesson.topic && <span>🎯 {lesson.topic}</span>}
                <span>👨‍🏫 {lesson.professor.name}</span>
                {lesson.estimatedTime && <span>⏱️ {lesson.estimatedTime} min</span>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Spent</div>
                <div className="text-xl font-bold text-blue-600">{formatTime(timeSpent)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-xl font-bold text-green-600 flex items-center">
                  {Math.round((completedSections.size / Math.max(lesson.sections.length, 1)) * 100)}%
                  {lesson.progress?.[0]?.status === 'COMPLETED' && (
                    <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ✅ Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Lesson Sections</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveSection(-1)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === -1 
                      ? 'bg-blue-100 text-blue-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📋 Overview
                </button>
                {lesson.sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      activeSection === index 
                        ? 'bg-blue-100 text-blue-800 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{section.title}</span>
                    {completedSections.has(index) && (
                      <span className="text-green-600">✅</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Learning Objectives */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">🎯 Learning Objectives</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {lesson.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Overview */}
              {activeSection === -1 && (
                <div className="p-8">
                  <div className="prose max-w-none">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">📖 Lesson Overview</h2>
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {lesson.content}
                    </div>
                  </div>

                  {lesson.resources.length > 0 && (
                    <div className="mt-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Resources</h3>
                      <ul className="space-y-2">
                        {lesson.resources.map((resource, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span className="text-gray-700">{resource}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setActiveSection(0)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                    >
                      🚀 Start Lesson
                    </button>
                  </div>
                </div>
              )}

              {/* Section Content */}
              {activeSection >= 0 && lesson.sections[activeSection] && (
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        Section {activeSection + 1} of {lesson.sections.length}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {lesson.sections[activeSection].title}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      {activeSection > 0 && (
                        <button
                          onClick={() => setActiveSection(activeSection - 1)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          ← Previous
                        </button>
                      )}
                      {activeSection < lesson.sections.length - 1 && (
                        <button
                          onClick={() => setActiveSection(activeSection + 1)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Next →
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="prose max-w-none mb-8">
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {lesson.sections[activeSection].content}
                    </div>
                  </div>

                  {/* Key Points */}
                  {lesson.sections[activeSection].metadata.keyPoints && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">🔑 Key Points</h4>
                      <ul className="space-y-1 text-blue-800">
                        {lesson.sections[activeSection].metadata.keyPoints.map((point, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Checkpoint Question */}
                  {lesson.sections[activeSection].metadata.checkpointQuestion && (
                    <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">💭 Think About This</h4>
                      <p className="text-yellow-800">{lesson.sections[activeSection].metadata.checkpointQuestion}</p>
                    </div>
                  )}

                  {/* Section Actions */}
                  <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      {!completedSections.has(activeSection) && (
                        <button
                          onClick={() => handleSectionComplete(activeSection)}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✅ Mark as Complete
                        </button>
                      )}
                      {completedSections.has(activeSection) && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <span>✅</span>
                          <span className="font-medium">Section Completed</span>
                        </div>
                      )}
                    </div>

                    {activeSection === lesson.sections.length - 1 && completedSections.size === lesson.sections.length && (
                      <button
                        onClick={markLessonComplete}
                        className={`px-6 py-3 font-semibold rounded-lg transition-all transform hover:scale-105 ${
                          lesson.progress?.[0]?.status === 'COMPLETED'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                            : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                        }`}
                      >
                        {lesson.progress?.[0]?.status === 'COMPLETED' 
                          ? '📚 Mark as Complete Again' 
                          : '🎉 Complete Lesson'
                        }
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        title={chatOpen ? "Close AI Chat" : "Ask Trace AI - Get help understanding this lesson content, ask questions, and receive explanations"}
        className={`fixed ${chatOpen ? 'bottom-6 right-[21rem]' : 'bottom-6 right-6'} w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50`}
      >
        {chatOpen ? '✕' : '🤖'}
      </button>

      {/* AI Chat Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
        chatOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold">Ask Trace AI</h3>
                  <p className="text-sm opacity-90">Get help with this lesson</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🎓</div>
                <p className="text-gray-600 mb-4">Hi! I'm Trace AI, your tutor for this lesson.</p>
                <p className="text-gray-500 text-sm">Ask me anything about the content, concepts, or examples - I'm here to help you learn!</p>
              </div>
            )}

            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about the lesson content..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                📤
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Light overlay for mobile responsiveness - only affects the lesson content area, not the entire screen */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setChatOpen(false)}
        />
      )}
    </div>
  );
} 