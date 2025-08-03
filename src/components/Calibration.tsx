import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditorStore } from '@/store/editorStore';

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
  "Learning to type without looking at the keyboard is a valuable skill. It allows you to focus on the content rather than the process of typing.",
  "Programming requires precise syntax and attention to detail. Every bracket, semicolon, and indentation matters in code."
];

interface CalibrationProps {
  onComplete: (referenceActions: any[]) => void;
  userId?: string;
}

const Calibration = ({ onComplete, userId }: CalibrationProps) => {
  const [step, setStep] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const { actions, addAction, clearActions } = useEditorStore();
  const lastKeyTime = useRef<number>(Date.now());
  const lastCursorPosition = useRef<{ from: number; to: number } | null>(null);
  const pauseThreshold = 2000; // 2 seconds pause threshold
  
  // Reset and select a random sample text when starting
  useEffect(() => {
    if (step === 1 && !isStarted) {
      clearActions();
      const randomIndex = Math.floor(Math.random() * SAMPLE_TEXTS.length);
      setSampleText(SAMPLE_TEXTS[randomIndex]);
      setIsStarted(true);
    }
  }, [step, isStarted, clearActions]);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    autofocus: true,
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

  // Add keyboard event listeners
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
  
  const handleStartCalibration = () => {
    setStep(1);
  };
  
  const handleSubmitCalibration = async () => {
    if (actions.length === 0) {
      alert('Please type the sample text to continue');
      return;
    }
    
    // Verify user has typed something
    if (editor && editor.getText().trim().length === 0) {
      alert('Please type the sample text to continue');
      return;
    }
    
    try {
      // Save reference data to the server
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actions,
          userId,
          sessionId: Date.now().toString(),
          isReference: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save reference data');
      }
      
      // Send the actions back to the parent component
      onComplete(actions);
      setIsCompleted(true);
      setStep(2);
    } catch (error) {
      console.error('Error saving reference data:', error);
      alert('Failed to save reference data. Please try again.');
    }
  };
  
  const handleReset = () => {
    clearActions();
    setIsStarted(false);
    setIsCompleted(false);
    setStep(0);
    if (editor) {
      editor.commands.setContent('<p></p>');
    }
  };
  
  if (!editor) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="calibration-container">
      {step === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Typing Behavior Calibration</h2>
          <p className="mb-4">
            Before proceeding, we need to capture your natural typing behavior. 
            This will help us verify that you are the same person later.
          </p>
          <p className="mb-6">
            You'll be asked to type a short paragraph exactly as shown. 
            Please type naturally as you normally would.
          </p>
          <button
            onClick={handleStartCalibration}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Start Calibration
          </button>
        </div>
      )}
      
      {step === 1 && (
        <div>
          <div className="sample-text p-4 bg-gray-100 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Please type the following text:</h3>
            <p className="text-gray-800">{sampleText}</p>
          </div>
          
          <div className="editor-container p-4 border border-gray-300 rounded-lg mb-4">
            <EditorContent editor={editor} className="min-h-[150px]" />
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Reset
            </button>
            <button
              onClick={handleSubmitCalibration}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Actions recorded: {actions.length}</p>
            <p>Text length: {editor.getText().length} characters</p>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="text-center p-8 bg-green-50 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-700">Calibration Complete!</h2>
          <p className="mb-6">
            Thank you! Your typing behavior has been recorded. You can now proceed to the main editor.
          </p>
          <button
            onClick={handleReset}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Start New Calibration
          </button>
        </div>
      )}
    </div>
  );
};

export default Calibration; 