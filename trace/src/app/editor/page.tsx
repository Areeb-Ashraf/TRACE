'use client';

import { useState } from 'react';
import Editor from '@/components/Editor';
import { useEditorStore } from '@/store/editorStore';

export default function EditorPage() {
  const { actions, clearActions } = useEditorStore();
  const [showActions, setShowActions] = useState(false);

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold mb-8">TRACE - Editor Behavior Tracking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="editor-section">
          <Editor />
        </div>
        
        <div className="actions-section">
          <div className="bg-gray-100 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tracked Actions</h2>
              <div className="space-x-2">
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {showActions ? 'Hide' : 'Show'} Actions
                </button>
                <button 
                  onClick={clearActions}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {showActions && (
              <div className="actions-log h-[500px] overflow-y-auto bg-white p-4 rounded border">
                {actions.length === 0 ? (
                  <p className="text-gray-500">No actions recorded yet. Start typing in the editor.</p>
                ) : (
                  <ul className="space-y-2">
                    {actions.map((action, index) => (
                      <li key={index} className="text-sm border-b pb-1">
                        <span className="font-mono bg-gray-100 px-1 rounded mr-2">
                          {new Date(action.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit', fractionalSecondDigits: 3})}
                        </span>
                        <span className={`inline-block w-16 ${getActionColor(action.type)}`}>
                          {action.type}
                        </span>
                        {action.content && <span className="ml-2">{truncate(action.content, 30)}</span>}
                        {action.position && (
                          <span className="ml-2 text-gray-500">
                            pos: {action.position.from}-{action.position.to}
                          </span>
                        )}
                        {action.pauseDuration && (
                          <span className="ml-2 text-yellow-600">
                            ({(action.pauseDuration / 1000).toFixed(1)}s)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function getActionColor(type: string): string {
  switch (type) {
    case 'insert': 
      return 'text-green-600';
    case 'delete': 
      return 'text-red-600';
    case 'cursor': 
      return 'text-blue-600';
    case 'pause': 
      return 'text-yellow-600';
    case 'selection': 
      return 'text-purple-600';
    default: 
      return 'text-gray-600';
  }
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
} 