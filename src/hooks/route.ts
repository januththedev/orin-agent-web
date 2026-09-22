import { useEffect, useState } from 'react';

function currentPath(): string {
  return window.location.hash.replace(/^#\/?/, '');
}

/** Tiny hash router: '' home, 'app', 'tasks/:id', 'settings', 'docs'. */
export function useRoute(): { path: string; navigate: (to: string) => void } {
  const [, setN] = useState(0);
  useEffect(() => {
    const onChange = () => setN((x) => x + 1);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return {
    path: currentPath(),
    navigate: (to: string) => {
      window.location.hash = '#/' + to.replace(/^\//, '');
    },
  };
}
