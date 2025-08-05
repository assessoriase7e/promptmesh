import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface UndoRedoHook {
  undo: () => CanvasState | null;
  redo: () => CanvasState | null;
  saveState: (nodes: Node[], edges: Edge[]) => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  currentIndex: number;
  historyLength: number;
}

const MAX_HISTORY_SIZE = 50;

export const useUndoRedo = (projectId?: string): UndoRedoHook => {
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isApplyingState = useRef(false);

  const storageKey = `promptmesh_canvas_history_${projectId || 'default'}`;

  // Carregar histórico do localStorage na inicialização
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed.history) && typeof parsed.currentIndex === 'number') {
          setHistory(parsed.history);
          setCurrentIndex(parsed.currentIndex);
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar histórico do localStorage:', error);
    }
  }, [storageKey]);

  // Salvar no localStorage sempre que o histórico mudar
  const saveToLocalStorage = useCallback((newHistory: CanvasState[], newIndex: number) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        history: newHistory,
        currentIndex: newIndex
      }));
    } catch (error) {
      console.warn('Erro ao salvar histórico no localStorage:', error);
    }
  }, [storageKey]);

  // Salvar estado atual
  const saveState = useCallback((nodes: Node[], edges: Edge[]) => {
    // Não salvar se estivermos aplicando um estado do histórico
    if (isApplyingState.current) return;

    const newState: CanvasState = {
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)), // Deep clone
      timestamp: Date.now()
    };

    setHistory(prevHistory => {
      setCurrentIndex(prevIndex => {
        // Se estivermos no meio do histórico, remover estados "futuros"
        const newHistory = prevHistory.slice(0, prevIndex + 1);
        
        // Adicionar novo estado
        newHistory.push(newState);
        
        // Manter apenas os últimos MAX_HISTORY_SIZE estados
        if (newHistory.length > MAX_HISTORY_SIZE) {
          newHistory.shift();
          const newIndex = newHistory.length - 1;
          saveToLocalStorage(newHistory, newIndex);
          return newIndex;
        }
        
        const newIndex = newHistory.length - 1;
        saveToLocalStorage(newHistory, newIndex);
        return newIndex;
      });
      
      // Retornar o novo histórico
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }
      
      return newHistory;
    });
  }, [currentIndex, saveToLocalStorage]);

  // Desfazer
  const undo = useCallback((): CanvasState | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    const state = history[newIndex];
    
    if (state) {
      isApplyingState.current = true;
      setCurrentIndex(newIndex);
      saveToLocalStorage(history, newIndex);
      
      // Reset flag após um pequeno delay
      setTimeout(() => {
        isApplyingState.current = false;
      }, 100);
      
      return state;
    }
    
    return null;
  }, [currentIndex, history, saveToLocalStorage]);

  // Refazer
  const redo = useCallback((): CanvasState | null => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    const state = history[newIndex];
    
    if (state) {
      isApplyingState.current = true;
      setCurrentIndex(newIndex);
      saveToLocalStorage(history, newIndex);
      
      // Reset flag após um pequeno delay
      setTimeout(() => {
        isApplyingState.current = false;
      }, 100);
      
      return state;
    }
    
    return null;
  }, [currentIndex, history, saveToLocalStorage]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    saveToLocalStorage([], -1);
  }, [saveToLocalStorage]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    undo,
    redo,
    saveState,
    canUndo,
    canRedo,
    clearHistory,
    currentIndex,
    historyLength: history.length
  };
};