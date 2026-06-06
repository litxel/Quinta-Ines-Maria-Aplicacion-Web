import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('qim-theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('qim-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('qim-theme', 'light');
    }
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return { isDark, toggle };
}
