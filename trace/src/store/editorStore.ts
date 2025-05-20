import { create } from 'zustand';

type ActionType = 'insert' | 'delete' | 'cursor' | 'pause' | 'selection';

interface EditorAction {
  type: ActionType;
  content?: string;
  position?: { from: number; to: number };
  timestamp: number;
  pauseDuration?: number;
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