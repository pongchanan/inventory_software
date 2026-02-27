import { useState, useEffect, useLayoutEffect } from 'react';

// Use strict fallback to prevent hydration mismatch for window object
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useIsomorphicLayoutEffect(() => {
        const mediaQuery = window.matchMedia(query);

        // Initial set - safe in layout effect
        if (matches !== mediaQuery.matches) {
            setMatches(mediaQuery.matches);
        }

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query, matches]);

    return matches;
}
