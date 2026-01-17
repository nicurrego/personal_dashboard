'use client';

import { useEffect } from 'react';
import { useHeader } from './header-context';

export default function PageTitle({ title, children }: { title: string, children?: React.ReactNode }) {
  const { setTitle, setActions } = useHeader();

  useEffect(() => {
    setTitle(title);
    if (children) {
      setActions(children);
    }
    return () => {
      setTitle('');
      setActions(null);
    };
  }, [title, children, setTitle, setActions]);

  return null;
}
