import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

const Editor = () => {
  const { addAction } = useEditorStore();
  const lastKeyTime = useRef<number>(Date.now());
  const lastCursorPosition = useRef<{ from: number; to: number } | null>(null);
  const pauseThreshold = 2000; // 2 seconds pause threshold

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
      <div className="mt-2 text-sm text-gray-500">
        Start typing to see behavior tracking in action...
      </div>
    </div>
  );
};

export default Editor; 