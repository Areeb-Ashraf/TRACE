'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react'; // Import useSession

interface AssignmentForm {
  topic: string;
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'essay' | 'project' | 'presentation' | 'research' | 'discussion' | 'quiz';
  duration: number;
  requirements: string;
  classId: string; // Add classId to AssignmentForm
}

interface GeneratedAssignment {
  title: string;
  description: string;
  instructions: string | string[];
  rubric: {
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
  resources: string[];
  learningOutcomes: string[];
  tips: string[];
  extensions: string[];
  estimatedTime: number;
}

export default function AIAssignmentCreator() {
  const [form, setForm] = useState<AssignmentForm>({
    topic: '',
    learningObjectives: [''],
    difficulty: 'intermediate',
    type: 'essay',
    duration: 60,
    requirements: '',
    classId: '' // Initialize classId
  });

  const [generatedAssignment, setGeneratedAssignment] = useState<GeneratedAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
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

  const handleInputChange = (field: keyof AssignmentForm, value: any) => {
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

  const generateAssignment = async () => {
    // Validate form
    if (!form.topic || !form.classId) { // Changed validation
      showError('Please fill in all required fields');
      return;
    }

    if (form.learningObjectives.some(obj => !obj.trim())) {
      showError('Please fill in all learning objectives');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/assignment-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_assignment',
          data: {
            ...form,
            learningObjectives: form.learningObjectives.filter(obj => obj.trim())
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedAssignment(data.assignment);
        setActiveTab('preview');
        success('Assignment generated successfully!');
      } else {
        showError(data.error || 'Failed to generate assignment');
      }
    } catch (err) {
      showError('Failed to generate assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const createAssignmentFromAI = async () => {
    if (!generatedAssignment) return;

    try {
      // Convert instructions array to string if it's an array
      const instructions = Array.isArray(generatedAssignment.instructions) 
        ? generatedAssignment.instructions.join('\n\n')
        : generatedAssignment.instructions;

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedAssignment.title,
          description: generatedAssignment.description,
          instructions: instructions,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          estimatedTime: generatedAssignment.estimatedTime,
          maxWords: form.type === 'essay' ? 1000 : undefined,
          minWords: form.type === 'essay' ? 500 : undefined,
          status: 'DRAFT',
          classId: form.classId, // Include classId
        })
      });

      const data = await response.json();
      
      if (data.assignment) {
        success('Assignment created and saved!');
        // Reset form
        setForm({
          topic: '',
          learningObjectives: [''],
          difficulty: 'intermediate',
          type: 'essay',
          duration: 60,
          requirements: '',
          classId: '' // Reset classId
        });
        setGeneratedAssignment(null);
        setActiveTab('form');
      } else {
        showError('Failed to save assignment');
      }
    } catch (err) {
      showError('Failed to save assignment');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assignment Creator</h2>
        <p className="text-gray-600">Create engaging assignments with AI assistance</p>
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
          Assignment Form
        </button>
        {generatedAssignment && (
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Preview
          </button>
        )}
      </div>

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Machine Learning, Calculus"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Objectives *
            </label>
            {form.learningObjectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleLearningObjectiveChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Learning objective ${index + 1}`}
                />
                {form.learningObjectives.length > 1 && (
                  <button
                    onClick={() => removeLearningObjective(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addLearningObjective}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Learning Objective
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Type
              </label>
              <select
                value={form.type}
                onChange={(e) => handleInputChange('type', e.target.value as 'essay' | 'project' | 'presentation' | 'research' | 'discussion' | 'quiz')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="essay">Essay</option>
                <option value="project">Project</option>
                <option value="presentation">Presentation</option>
                <option value="research">Research</option>
                <option value="discussion">Discussion</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="15"
                max="240"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Requirements
            </label>
            <textarea
              value={form.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any specific requirements, constraints, or additional context..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={generateAssignment}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Assignment'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && generatedAssignment && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              {generatedAssignment.title}
            </h3>
            <p className="text-blue-800 mb-4">{generatedAssignment.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Estimated Time:</span> {generatedAssignment.estimatedTime} minutes
              </div>
              <div>
                <span className="font-medium">Total Points:</span> {generatedAssignment.rubric.totalPoints}
              </div>
              <div>
                <span className="font-medium">Type:</span> {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Instructions</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              {Array.isArray(generatedAssignment.instructions) ? (
                <ol className="list-decimal list-inside space-y-2">
                  {generatedAssignment.instructions.map((instruction, index) => (
                    <li key={index} className="text-gray-700">{instruction}</li>
                  ))}
                </ol>
              ) : (
                <div className="whitespace-pre-wrap">{generatedAssignment.instructions}</div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Grading Rubric</h4>
            <div className="space-y-3">
              {generatedAssignment.rubric.criteria.map((criterion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">{criterion.name} ({criterion.points} points)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-green-600">Excellent:</span>
                      <p>{criterion.excellent}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Good:</span>
                      <p>{criterion.good}</p>
                    </div>
                    <div>
                      <span className="font-medium text-yellow-600">Satisfactory:</span>
                      <p>{criterion.satisfactory}</p>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Needs Improvement:</span>
                      <p>{criterion.needsImprovement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {generatedAssignment.resources.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Required Resources</h4>
              <ul className="list-disc list-inside space-y-1">
                {generatedAssignment.resources.map((resource, index) => (
                  <li key={index}>{resource}</li>
                ))}
              </ul>
            </div>
          )}

          {generatedAssignment.tips.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tips for Students</h4>
              <ul className="list-disc list-inside space-y-1">
                {generatedAssignment.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setActiveTab('form')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Form
            </button>
            <button
              onClick={createAssignmentFromAI}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Create Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 