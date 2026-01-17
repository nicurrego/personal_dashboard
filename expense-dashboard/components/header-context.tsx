'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const HeaderContext = createContext<{
  title: string;
  setTitle: (title: string) => void;
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
  centerContent: ReactNode;
  setCenterContent: (content: ReactNode) => void;
}>({
  title: '',
  setTitle: () => {},
  actions: null,
  setActions: () => {},
  centerContent: null,
  setCenterContent: () => {},
});

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [actions, setActions] = useState<ReactNode>(null);
  const [centerContent, setCenterContent] = useState<ReactNode>(null);

  return (
    <HeaderContext.Provider value={{ title, setTitle, actions, setActions, centerContent, setCenterContent }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  return useContext(HeaderContext);
}
