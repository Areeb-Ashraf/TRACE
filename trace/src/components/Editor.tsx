import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../store/editorStore';

interface EditorProps {
  onAnalyze?: (result: any) => void;
  referenceActions?: any[];
  userId?: string;
}

const Editor = ({ onAnalyze, referenceActions, userId }: EditorProps) => {
  const { actions, addAction, clearActions } = useEditorStore();
  const lastKeyTime = useRef<number>(Date.now());
  const lastCursorPosition = useRef<{ from: number; to: number } | null>(null);
  const pauseThreshold = 2000; // 2 seconds pause threshold
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Start typing here to see behavior tracking in action...</p>',
    onUpdate: ({ editor }) => {
      const currentTime = Date.now();
      
      // Log the content change with timestamp
      addAction({
        type: 'insert',
        content: editor.getText(),
        timestamp: currentTime,
      });
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

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeSinceLastKey = currentTime - lastKeyTime.current;

      // Check if there was a significant pause before this keystroke
      if (timeSinceLastKey > pauseThreshold) {
        addAction({
          type: 'pause',
          timestamp: currentTime,
          pauseDuration: timeSinceLastKey,
        });
      }

      // Log the keystroke
      addAction({
        type: 'insert',
        content: event.key,
        timestamp: currentTime,
      });
      
      lastKeyTime.current = currentTime;
    };

    const handleKeyUp = () => {
      lastKeyTime.current = Date.now();
    };

    const dom = editor.view.dom;
    dom.addEventListener('keydown', handleKeyDown);
    dom.addEventListener('keyup', handleKeyUp);

    // Track delete actions
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        addAction({
          type: 'delete',
          timestamp: Date.now(),
        });
      }
    };
    
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

      // Save actions to the server
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
            textContent: editor ? editor.getText() : undefined // Include the actual text content for AI detection
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error('Failed to analyze actions');
        }

        const analysisResult = await analysisResponse.json();
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
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container p-4 border border-gray-300 rounded-md">
      <div className="editor-header mb-2 pb-2 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Rich Text Editor</h2>
        <p className="text-sm text-gray-500">Your keystrokes, pauses and cursor movements are being tracked</p>
      </div>
      
      <EditorContent editor={editor} className="min-h-[200px] prose max-w-none" />
      
      <div className="editor-controls mt-4 flex items-center justify-between">
        <div className="actions-count text-sm text-gray-500">
          Actions recorded: {actions.length}
          {saveStatus && (
            <span className="ml-2 text-blue-600">{saveStatus}</span>
          )}
        </div>
        
        <div className="buttons space-x-2">
          <button
            onClick={handleResetEditor}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            onClick={handleSaveActions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isSaving}
          >
            {isSaving ? 'Processing...' : 'Save & Analyze'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor; 