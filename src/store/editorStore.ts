import { create } from 'zustand';

type ActionType = 'insert' | 'delete' | 'cursor' | 'pause' | 'selection' | 'keydown' | 'keyup';

interface EditorAction {
  type: ActionType;
  content?: string;
  position?: { from: number; to: number };
  timestamp: number;
  pauseDuration?: number;
  dwellTime?: number; // Time key is held down
  flightTime?: number; // Time between previous key up and this key down
  errorType?: 'transposition' | 'substitution' | 'omission' | 'insertion'; // For error pattern analysis
}

interface EditorState {
  actions: EditorAction[];
  addAction: (action: EditorAction) => void;
  clearActions: () => void;
  getActions: () => EditorAction[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  actions: [],
  
  addAction: (action) =>
    set((state) => ({
      actions: [...state.actions, action],
    })),
  
  clearActions: () => 
    set({ actions: [] }),
  
  getActions: () => get().actions,
})); 