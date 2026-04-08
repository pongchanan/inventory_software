import { useEffect, useRef, useState } from "react";
import { Item, searchItems } from "@/lib/api";

const DEBOUNCE_MS = 350;

/**
 * Debounced search hook: fires a backend search when the user types 2+ chars.
 * Returns the first matching item (if any) and a loading flag.
 */
export function useItemSuggestion(
  inputName: string,
  dismissed: boolean
): { suggestion: Item | null; searching: boolean } {
  const [suggestion, setSuggestion] = useState<Item | null>(null);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = inputName.trim();

    if (trimmed.length < 2 || dismissed) {
      setSuggestion(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchItems(trimmed);
        // Only suggest if there's a result that isn't an exact case-insensitive match
        // (exact match means the user is intentionally re-adding, let them proceed)
        const best = results.find(
          (r) => r.name.toLowerCase() !== trimmed.toLowerCase()
        ) ?? results[0] ?? null;
        setSuggestion(best);
      } catch {
        setSuggestion(null);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputName, dismissed]);

  return { suggestion, searching };
}
