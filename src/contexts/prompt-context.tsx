"use client";

import { createContext, useContext, ReactNode } from 'react';
import { PromptTemplate, PromptCategory } from '@/types';

interface PromptContextType {
  templates: PromptTemplate[];
  categories: PromptCategory[];
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

interface PromptProviderProps {
  children: ReactNode;
  templates: PromptTemplate[];
  categories: PromptCategory[];
}

export const PromptProvider = ({ children, templates, categories }: PromptProviderProps) => {
  return (
    <PromptContext.Provider value={{ templates, categories }}>
      {children}
    </PromptContext.Provider>
  );
};

export const usePromptContext = () => {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePromptContext must be used within a PromptProvider');
  }
  return context;
};