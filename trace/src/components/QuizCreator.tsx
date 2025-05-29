import React, { useState } from 'react';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  question: string;
  points: number;
  explanation?: string;
  options: QuizOption[];
}

interface QuizCreatorProps {
  onSave: (quizData: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const QuizCreator = ({ onSave, onCancel, loading = false }: QuizCreatorProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    estimatedTime: '',
    timeLimit: '',
    allowReview: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED'
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE') => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      type,
      question: '',
      points: 1,
      explanation: '',
      options: type === 'TRUE_FALSE' 
        ? [
            { id: generateId(), text: 'True', isCorrect: false },
            { id: generateId(), text: 'False', isCorrect: false }
          ]
        : [
            { id: generateId(), text: '', isCorrect: false },
            { id: generateId(), text: '', isCorrect: false }
          ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: [...q.options, { id: generateId(), text: '', isCorrect: false }] 
          }
        : q
    ));
  };

  const updateOption = (questionId: string, optionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            options: q.options.map(opt => 
              opt.id === optionId ? { ...opt, [field]: value } : opt
            )
          }
        : q
    ));
  };

  const deleteOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: q.options.filter(opt => opt.id !== optionId) }
        : q
    ));
  };

  const validateQuiz = () => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Quiz title is required');
    }

    if (!formData.description.trim()) {
      newErrors.push('Quiz description is required');
    }

    if (!formData.dueDate) {
      newErrors.push('Due date is required');
    }

    if (questions.length === 0) {
      newErrors.push('At least one question is required');
    }

    questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors.push(`Question ${index + 1}: Question text is required`);
      }

      if (question.options.length < 2) {
        newErrors.push(`Question ${index + 1}: At least 2 options are required`);
      }

      const hasCorrectAnswer = question.options.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        newErrors.push(`Question ${index + 1}: At least one correct answer is required`);
      }

      question.options.forEach((option, optIndex) => {
        if (!option.text.trim()) {
          newErrors.push(`Question ${index + 1}, Option ${optIndex + 1}: Option text is required`);
        }
      });

      if (question.type === 'TRUE_FALSE' && question.options.length !== 2) {
        newErrors.push(`Question ${index + 1}: True/False questions must have exactly 2 options`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuiz()) {
      return;
    }

    const quizData = {
      ...formData,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
      timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
      questions: questions.map((q, index) => ({
        type: q.type,
        question: q.question,
        points: q.points,
        order: index + 1,
        explanation: q.explanation,
        options: q.options.map((opt, optIndex) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          order: optIndex + 1
        }))
      }))
    };

    onSave(quizData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Quiz</h2>
        <p className="text-gray-600 dark:text-gray-300">Design a quiz with multiple choice and true/false questions</p>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-700">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-red-700 dark:text-red-300 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Quiz Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter quiz title"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Describe the quiz purpose and content"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Special instructions for students"
          />
        </div>

        {/* Quiz Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        {/* Quiz Options */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowReview}
                onChange={(e) => setFormData({ ...formData, allowReview: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Allow review after submission</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Randomize question order</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.randomizeOptions}
                onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Randomize option order</span>
            </label>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => addQuestion('MULTIPLE_CHOICE')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                + Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion('TRUE_FALSE')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                + True/False
              </button>
            </div>
          </div>

          {questions.map((question, questionIndex) => (
            <div key={question.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  Question {questionIndex + 1} ({question.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'True/False'})
                </h4>
                <button
                  type="button"
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    placeholder="Enter your question"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Explanation (optional)
                    </label>
                    <input
                      type="text"
                      value={question.explanation}
                      onChange={(e) => updateQuestion(question.id, 'explanation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                      placeholder="Explain the correct answer"
                    />
                  </div>
                </div>

                {/* Options */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Answer Options *
                    </label>
                    {question.type === 'MULTIPLE_CHOICE' && (
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <input
                          type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                          name={`question-${question.id}`}
                          checked={option.isCorrect}
                          onChange={(e) => {
                            if (question.type === 'TRUE_FALSE') {
                              // For true/false, only one can be correct
                              setQuestions(questions.map(q => 
                                q.id === question.id 
                                  ? {
                                      ...q,
                                      options: q.options.map((opt, idx) => ({
                                        ...opt,
                                        isCorrect: idx === optionIndex
                                      }))
                                    }
                                  : q
                              ));
                            } else {
                              updateOption(question.id, option.id, 'isCorrect', e.target.checked);
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                          placeholder={`Option ${optionIndex + 1}`}
                          disabled={question.type === 'TRUE_FALSE'}
                        />
                        {question.type === 'MULTIPLE_CHOICE' && question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => deleteOption(question.id, option.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No questions added yet. Click the buttons above to add your first question.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator; 