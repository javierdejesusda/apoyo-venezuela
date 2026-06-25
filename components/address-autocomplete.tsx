'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';

import { Input, Label } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { GeoSearchFn, GeoSuggestion } from '@/lib/geocoding/types';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

interface AddressAutocompleteProps {
  value: string;
  onValueChange: (text: string) => void;
  onSelect: (suggestion: GeoSuggestion) => void;
  onSearch: GeoSearchFn;
  label?: string;
  placeholder?: string;
  helpText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Accessible address combobox. The forward-search function is injected so the
 * component stays decoupled from the server action and is trivially testable.
 * Searches are debounced and guarded by a sequence number so a slow, stale
 * response can never overwrite a fresher one.
 */
export function AddressAutocomplete({
  value,
  onValueChange,
  onSelect,
  onSearch,
  label,
  placeholder,
  helpText,
  disabled,
  id,
  className,
}: AddressAutocompleteProps): React.JSX.Element {
  const reactId = useId();
  const inputId = id ?? `${reactId}-input`;
  const listId = `${reactId}-list`;
  const helpId = `${reactId}-help`;
  const optionId = (index: number): string => `${reactId}-option-${index}`;

  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic request id: the resolution of any request whose id is no longer
  // the latest is discarded (sequence guard against out-of-order responses).
  const requestSeqRef = useRef(0);

  const runSearch = useCallback(
    async (query: string): Promise<void> => {
      const seq = ++requestSeqRef.current;
      setLoading(true);
      setOpen(true);
      let results: GeoSuggestion[] = [];
      try {
        results = await onSearch(query);
      } catch {
        results = [];
      }
      if (seq !== requestSeqRef.current) return;
      setSuggestions(results);
      setActiveIndex(-1);
      setLoading(false);
    },
    [onSearch],
  );

  function scheduleSearch(text: string): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = text.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      // Invalidate any in-flight request so it cannot reopen the list later.
      requestSeqRef.current++;
      setSuggestions([]);
      setActiveIndex(-1);
      setLoading(false);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);
  }

  function closeAndReset(): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Invalidate in-flight requests so a late resolution cannot reopen the list.
    requestSeqRef.current++;
    setOpen(false);
    setLoading(false);
    setActiveIndex(-1);
  }

  function selectSuggestion(suggestion: GeoSuggestion): void {
    onSelect(suggestion);
    onValueChange(suggestion.primary);
    closeAndReset();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const text = event.target.value;
    onValueChange(text);
    scheduleSearch(text);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // Clear any pending debounce on unmount to avoid a late search after teardown.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const showEmpty = open && !loading && suggestions.length === 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <Input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-describedby={helpText ? helpId : undefined}
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={closeAndReset}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10 disabled:opacity-50"
        />
        {loading && (
          <Loader2
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint"
            aria-hidden
          />
        )}

        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-border-strong bg-surface py-1 shadow-pop"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 px-3.5 py-2',
                  index === activeIndex ? 'bg-surface-2' : 'bg-transparent',
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {suggestion.primary}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {suggestion.secondary}
                  </span>
                </span>
              </li>
            ))}

            {showEmpty && (
              <li className="px-3.5 py-2 text-sm text-ink-faint">Sin resultados</li>
            )}
          </ul>
        )}
      </div>

      {helpText && (
        <p id={helpId} className="text-xs text-ink-faint">
          {helpText}
        </p>
      )}
    </div>
  );
}
