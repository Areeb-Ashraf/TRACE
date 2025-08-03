import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  estimatedTime?: number;
  maxWords?: number;
  minWords?: number;
}

interface EditorProps {
  onAnalyze?: (result: any) => void;
  referenceActions?: any[];
  userId?: string;
  assignmentMode?: boolean;
  onSave?: (textContent: string, wordCount: number, timeSpent: number) => void;
  initialContent?: string;
  assignment?: Assignment | null;
}

const Editor = ({ 
  onAnalyze, 
  referenceActions, 
  userId, 
  assignmentMode = false,
  onSave,
  initialContent,
  assignment
}: EditorProps) => {
  const { actions, addAction, clearActions } = useEditorStore();
  const lastKeyTime = useRef<number>(Date.now());
  const lastCursorPosition = useRef<{ from: number; to: number } | null>(null);
  const pauseThreshold = 2000; // 2 seconds pause threshold
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTime = useRef<number>(Date.now());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getInitialContent = () => {
    if (initialContent) {
      return initialContent;
    }
    if (assignmentMode && assignment) {
      return `<p>Begin writing your assignment: "${assignment.title}"</p><p></p>`;
    }
    return '<p>Start typing here to see behavior tracking in action...</p>';
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: getInitialContent(),
    onUpdate: ({ editor }) => {
      const currentTime = Date.now();
      const text = editor.getText();
      
      // Update word count
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
      
      // Update time spent
      const timeInMinutes = Math.floor((currentTime - startTime.current) / 1000 / 60);
      setTimeSpent(timeInMinutes);
      
      // Log the content change with timestamp
      addAction({
        type: 'insert',
        content: text,
        timestamp: currentTime,
      });

      // Auto-save for assignments
      if (assignmentMode && onSave) {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout for auto-save (save after 3 seconds of inactivity)
        saveTimeoutRef.current = setTimeout(() => {
          onSave(text, words, timeInMinutes);
        }, 3000);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const selection = editor.state.selection;
      const currentTime = Date.now();
      const currentPosition = { from: selection.from, to: selection.to };
      
      // Only log if the cursor position changed
      if (!lastCursorPosition.current || 
          lastCursorPosition.current.from !== currentPosition.from || 
          lastCursorPosition.current.to !== currentPosition.to) {
        
        addAction({
          type: 'cursor',
          position: currentPosition,
          timestamp: currentTime,
        });
        
        lastCursorPosition.current = currentPosition;
      }
    },
  });

  // Load initial content when component mounts or initialContent changes
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
      // Update word count for initial content
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      setWordCount(words);
    }
  }, [editor, initialContent]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;

    let lastKeyDownTime: Record<string, number> = {};
    let lastKeyUpTime: number = Date.now();

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime.current;
      const flightTime = currentTime - lastKeyUpTime;
      lastKeyTime.current = currentTime;

      // Check if there was a significant pause before this keystroke
      if (timeSinceLastKey > pauseThreshold) {
        addAction({
          type: 'pause',
          timestamp: currentTime,
          pauseDuration: timeSinceLastKey,
        });
      }

      // Log the keydown event for dwell/flight time
      addAction({
        type: 'keydown',
        content: event.key,
        timestamp: currentTime,
        flightTime,
      });
      lastKeyDownTime[event.key] = currentTime;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const dwellTime = lastKeyDownTime[event.key]
        ? currentTime - lastKeyDownTime[event.key]
        : undefined;
      addAction({
        type: 'keyup',
        content: event.key,
        timestamp: currentTime,
        dwellTime,
      });
      lastKeyUpTime = currentTime;
    };

    // Track delete actions
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        addAction({
          type: 'delete',
          timestamp: Date.now(),
        });
      }
    };
    
    const dom = editor.view.dom;
    dom.addEventListener('keydown', handleKeyDown);
    dom.addEventListener('keyup', handleKeyUp);
    dom.addEventListener('keydown', handleDelete);

    return () => {
      dom.removeEventListener('keydown', handleKeyDown);
      dom.removeEventListener('keyup', handleKeyUp);
      dom.removeEventListener('keydown', handleDelete);
    };
  }, [editor, addAction]);

  const handleSaveActions = async () => {
    if (actions.length === 0) {
      alert('No actions to save. Please type something first.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('Saving your typing data...');

      const textContent = editor ? editor.getText() : '';

      // Save actions to the server (for non-assignment mode)
      if (!assignmentMode) {
        const response = await fetch('/api/actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actions,
            userId,
            sessionId: sessionId || Date.now().toString(),
            isReference: false
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save actions');
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        setSaveStatus('Data saved successfully!');
      }

      // If reference actions exist, perform analysis
      if (referenceActions && referenceActions.length > 0 && onAnalyze) {
        setSaveStatus('Analyzing your typing behavior...');
        
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actions,
            referenceActions,
            textContent,
            wordCount,
            timeSpent
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to analyze actions');
        }

        const analysisResult = await analysisResponse.json();
        // Add text content and stats to analysis result
        analysisResult.textContent = textContent;
        analysisResult.wordCount = wordCount;
        analysisResult.timeSpent = timeSpent;
        
        onAnalyze(analysisResult);
        setSaveStatus('Analysis complete!');
      }
    } catch (error) {
      console.error('Error saving/analyzing actions:', error);
      setSaveStatus('Error: Failed to process your data');
    } finally {
      setIsSaving(false);
      // Reset status message after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };

  const handleResetEditor = () => {
    if (editor) {
      editor.commands.setContent('<p></p>');
    }
    clearActions();
    setSessionId(null);
    setSaveStatus(null);
    setWordCount(0);
    setTimeSpent(0);
    startTime.current = Date.now();
  };

  const getWordCountStatus = () => {
    if (!assignment || (!assignment.minWords && !assignment.maxWords)) {
      return null;
    }

    const { minWords, maxWords } = assignment;
    let status = '';
    let color = 'text-gray-500';

    if (minWords && maxWords) {
      if (wordCount < minWords) {
        status = `${minWords - wordCount} words needed`;
        color = 'text-yellow-600';
      } else if (wordCount > maxWords) {
        status = `${wordCount - maxWords} words over limit`;
        color = 'text-red-600';
      } else {
        status = 'Word count within range';
        color = 'text-green-600';
      }
    } else if (minWords && wordCount < minWords) {
      status = `${minWords - wordCount} words needed`;
      color = 'text-yellow-600';
    } else if (maxWords && wordCount > maxWords) {
      status = `${wordCount - maxWords} words over limit`;
      color = 'text-red-600';
    }

    return { status, color };
  };

  const isOverdue = (dueDate: string) => {
    return new Date() > new Date(dueDate);
  };

  if (!editor) {
    return null;
  }

  const wordCountStatus = getWordCountStatus();

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {assignmentMode ? 'Assignment Editor' : 'Practice Editor'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {assignmentMode 
            ? 'Complete your assignment below. All typing behavior is monitored for academic integrity.'
            : 'Your keystrokes, pauses and cursor movements are being tracked for analysis.'
          }
        </p>
        
        {/* Assignment warnings */}
        {assignmentMode && assignment && isOverdue(assignment.dueDate) && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ⚠️ This assignment is overdue. You may still work on it, but it will be marked as late.
            </p>
          </div>
        )}
        
        {/* Stats Bar */}
        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Words: {wordCount}</span>
            {wordCountStatus && (
              <span className={`ml-2 ${wordCountStatus.color}`}>
                ({wordCountStatus.status})
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Time: {timeSpent}m</span>
            {assignment && assignment.estimatedTime && (
              <span className={`ml-2 ${timeSpent > assignment.estimatedTime ? 'text-yellow-600' : 'text-gray-500'}`}>
                (Est: {assignment.estimatedTime}m)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Actions: {actions.length}</span>
          </div>
          {assignmentMode && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600">Auto-saving</span>
            </div>
          )}
        </div>
      </div>
      
      <EditorContent 
        editor={editor} 
        className="min-h-[400px] prose prose-gray dark:prose-invert max-w-none focus:outline-none"
      />
      
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {saveStatus && (
            <span className="text-blue-600 dark:text-blue-400">{saveStatus}</span>
          )}
        </div>
        
        <div className="flex space-x-3">
          {!assignmentMode && (
            <button
              onClick={handleResetEditor}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              disabled={isSaving}
            >
              Reset
            </button>
          )}
          <button
            onClick={handleSaveActions}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? 'Processing...' : assignmentMode ? 'Analyze Work' : 'Save & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor; 