'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react'; // Import useSession

interface LessonForm {
  topic: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  requirements: string;
  sourceType: 'manual' | 'document';
  classId: string; // Add classId
}

interface GeneratedLesson {
  title: string;
  description: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
    sectionType: string;
    order: number;
    metadata: {
      keyPoints?: string[];
      examples?: string[];
      checkpointQuestion?: string;
      documentReferences?: string[];
    };
  }>;
  learningObjectives: string[];
  resources: string[];
  estimatedTime: number;
  keyTakeaways: string[];
}

interface AILessonCreatorProps {
  onLessonCreated?: (lesson: any) => void; // Now accepts lesson object
}

export default function AILessonCreator({ onLessonCreated }: AILessonCreatorProps) {
  const [form, setForm] = useState<LessonForm>({
    topic: '',
    learningObjectives: [''],
    difficulty: 'intermediate',
    duration: 60,
    requirements: '',
    sourceType: 'manual',
    classId: '' // Initialize classId
  });

  const [generatedLesson, setGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();
  const { data: session } = useSession(); // Get session

  const [classes, setClasses] = useState<any[]>([]); // State for classes

  useEffect(() => {
    if (session?.user?.role === "PROFESSOR") {
      fetchClasses();
    }
  }, [session]);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
        // Optionally set a default class if classes exist
        if (data.length > 0 && !form.classId) {
          setForm(prev => ({ ...prev, classId: data[0].id }));
        }
      } else {
        showError('Failed to load classes.');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      showError('Error loading classes.');
    }
  };

  const handleInputChange = (field: keyof LessonForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLearningObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...form.learningObjectives];
    newObjectives[index] = value;
    setForm(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const addLearningObjective = () => {
    if (form.learningObjectives.length < 5) {
      setForm(prev => ({ ...prev, learningObjectives: [...prev.learningObjectives, ''] }));
    }
  };

  const removeLearningObjective = (index: number) => {
    if (form.learningObjectives.length > 1) {
      const newObjectives = form.learningObjectives.filter((_, i) => i !== index);
      setForm(prev => ({ ...prev, learningObjectives: newObjectives }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      showError('Please upload PDF or TXT files only');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showError('File too large. Please upload files smaller than 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/ai/lesson-creator', {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setDocumentContent(data.documentContent);
        setUploadedFileName(data.fileName);
        setForm(prev => ({ ...prev, sourceType: 'document' }));
        success('Document uploaded and processed successfully!');
      } else {
        showError(data.error || 'Failed to process document');
      }
    } catch (error) {
      showError('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const generateLesson = async () => {
    // Validate form
    if (!form.topic || !form.classId) { // Changed validation
      showError('Please fill in all required fields');
      return;
    }

    if (form.learningObjectives.some(obj => !obj.trim())) {
      showError('Please fill in all learning objectives');
      return;
    }

    if (form.sourceType === 'document' && !documentContent) {
      showError('Please upload a document first');
      return;
    }

    setIsLoading(true);
    try {
      const action = form.sourceType === 'document' ? 'create_lesson_from_document' : 'create_lesson';
      
      const requestData = {
        ...form,
        learningObjectives: form.learningObjectives.filter(obj => obj.trim()),
        ...(form.sourceType === 'document' && { documentContent })
      };

      const response = await fetch('/api/ai/lesson-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data: requestData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedLesson(data.lesson);
        setActiveTab('preview');
        success('Lesson generated successfully!');
      } else {
        showError(data.error || 'Failed to generate lesson');
      }
    } catch (err) {
      showError('Failed to generate lesson');
    } finally {
      setIsLoading(false);
    }
  };

  const createLessonFromAI = async () => {
    if (!generatedLesson || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedLesson.title,
          description: generatedLesson.description,
          topic: form.topic,
          difficulty: form.difficulty,
          estimatedTime: generatedLesson.estimatedTime,
          learningObjectives: generatedLesson.learningObjectives,
          content: generatedLesson.content,
          resources: generatedLesson.resources,
          sections: generatedLesson.sections,
          status: 'PUBLISHED',
          sourceType: form.sourceType,
          classId: form.classId, // Include classId
        })
      });

      const data = await response.json();
      
      if (data.lesson) {
        success('Lesson created and published! Students can now access it.');
        // Reset form
        setForm({
          topic: '',
          learningObjectives: [''],
          difficulty: 'intermediate',
          duration: 60,
          requirements: '',
          sourceType: 'manual',
          classId: '' // Reset classId
        });
        setGeneratedLesson(null);
        setDocumentContent('');
        setUploadedFileName('');
        setActiveTab('form');
        if (onLessonCreated) {
          onLessonCreated(data.lesson); // Pass the created lesson back
        }
      } else {
        showError('Failed to save lesson');
      }
    } catch (err) {
      showError('Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎓 AI Lesson Creator</h2>
        <p className="text-gray-600">Create engaging lessons with AI assistance - from scratch or using your documents</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📝 Lesson Builder
        </button>
        {generatedLesson && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👁️ Preview
          </button>
        )}
      </div>

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Source Type Selection */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Choose Your Starting Point</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => handleInputChange('sourceType', 'manual')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  form.sourceType === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">✍️</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Create from Scratch</h4>
                    <p className="text-sm text-gray-600">Build a lesson using AI with your specifications</p>
                  </div>
                </div>
              </div>
              
              <div
                onClick={() => handleInputChange('sourceType', 'document')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  form.sourceType === 'document'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">📄</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Create from Document</h4>
                    <p className="text-sm text-gray-600">Upload a PDF/TXT and let AI create the lesson</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          {form.sourceType === 'document' && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Upload Your Document</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {isUploading ? '⏳ Processing...' : '📁 Choose File'}
                  </button>
                  {uploadedFileName && (
                    <span className="text-sm text-green-600 font-medium">
                      ✅ {uploadedFileName}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Supported formats: PDF, TXT • Max size: 10MB
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject */}
            {/* Removed Subject field */}
            
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Topic *
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="e.g., Quadratic Equations, World War II"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Class Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={form.classId}
                onChange={(e) => handleInputChange('classId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Difficulty Level
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">🟢 Beginner</option>
                <option value="intermediate">🟡 Intermediate</option>
                <option value="advanced">🔴 Advanced</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⏱️ Duration (minutes)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                min="15"
                max="300"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

          </div>

          {/* Learning Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Learning Objectives *
            </label>
            <div className="space-y-3">
              {form.learningObjectives.map((objective, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                    placeholder={`Learning objective ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {form.learningObjectives.length > 1 && (
                    <button
                      onClick={() => removeLearningObjective(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
              {form.learningObjectives.length < 5 && (
                <button
                  onClick={addLearningObjective}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  ➕ Add Another Objective
                </button>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📋 Additional Requirements
            </label>
            <textarea
              value={form.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="Any specific requirements, focus areas, or constraints..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={generateLesson}
              disabled={isLoading || (form.sourceType === 'document' && !documentContent)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? '🤖 Creating Lesson...' : '✨ Generate Lesson with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && generatedLesson && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{generatedLesson.title}</h3>
                <p className="text-gray-600 text-lg">{generatedLesson.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Estimated Time</div>
                <div className="text-xl font-semibold text-blue-600">⏱️ {generatedLesson.estimatedTime} min</div>
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Learning Objectives</h4>
            <ul className="space-y-2">
              {generatedLesson.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">📚 Content</h4>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {generatedLesson.content}
            </div>
          </div>

          {/* Sections */}
          {generatedLesson.sections.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">📖 Lesson Sections</h4>
              {generatedLesson.sections.map((section, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-2">{section.title}</h5>
                  <div className="text-gray-700 mb-3 whitespace-pre-wrap">{section.content}</div>
                  
                  {section.metadata.keyPoints && section.metadata.keyPoints.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-600 mb-1">🔑 Key Points:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {section.metadata.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {section.metadata.checkpointQuestion && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-sm font-medium text-yellow-800 mb-1">💭 Checkpoint Question:</div>
                      <div className="text-sm text-yellow-700">{section.metadata.checkpointQuestion}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resources */}
          {generatedLesson.resources.length > 0 && (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">📚 Resources</h4>
              <ul className="space-y-2">
                {generatedLesson.resources.map((resource, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="text-gray-700">{resource}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Takeaways */}
          {generatedLesson.keyTakeaways.length > 0 && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">💡 Key Takeaways</h4>
              <ul className="space-y-2">
                {generatedLesson.keyTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span className="text-gray-700">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              onClick={() => setActiveTab('form')}
              className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⬅️ Back to Form
            </button>
            <button
              onClick={createLessonFromAI}
              disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Lesson'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 