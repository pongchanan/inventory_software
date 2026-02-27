import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    // Default to true (desktop) on server to avoid layout shift on desktop devices, 
    // but better yet is returning undefined and handling it in the component.
    return matches;
}
