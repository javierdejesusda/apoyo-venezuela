// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AddressAutocomplete } from '@/components/address-autocomplete';
import type { GeoSearchFn, GeoSuggestion } from '@/lib/geocoding/types';

function makeSuggestion(over: Partial<GeoSuggestion>): GeoSuggestion {
  return {
    id: 'sug_1',
    label: 'Av. Francisco de Miranda, Chacao, Miranda',
    primary: 'Av. Francisco de Miranda',
    secondary: 'Chacao, Miranda',
    lat: 10.5,
    lng: -66.85,
    estado: 'Miranda',
    ciudad: 'Chacao',
    zona: null,
    accuracyM: 20,
    precision: 'exact',
    ...over,
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

// The component is controlled, so the harness owns the text value and lets the
// tests still spy on onValueChange.
function Harness(props: {
  onSearch: GeoSearchFn;
  onSelect?: (s: GeoSuggestion) => void;
  onValueChange?: (text: string) => void;
}): React.JSX.Element {
  const [value, setValue] = useState('');
  return (
    <AddressAutocomplete
      value={value}
      onValueChange={(text) => {
        setValue(text);
        props.onValueChange?.(text);
      }}
      onSelect={props.onSelect ?? (() => {})}
      onSearch={props.onSearch}
      label="Direccion"
      placeholder="Busca una direccion"
    />
  );
}

async function advanceDebounce(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('AddressAutocomplete', () => {
  it('does not call onSearch when fewer than three characters are typed', async () => {
    const onSearch = vi.fn<GeoSearchFn>();
    onSearch.mockResolvedValue([]);
    render(<Harness onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ab' } });
    await advanceDebounce();

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('searches after the debounce and renders the returned suggestions', async () => {
    const suggestions = [
      makeSuggestion({ id: 's1', primary: 'Av. Libertador', secondary: 'Caracas' }),
      makeSuggestion({ id: 's2', primary: 'Av. Bolivar', secondary: 'Valencia' }),
    ];
    const onSearch = vi.fn<GeoSearchFn>();
    onSearch.mockResolvedValue(suggestions);
    render(<Harness onSearch={onSearch} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ave' } });
    expect(onSearch).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(onSearch).toHaveBeenCalledWith('ave');
    expect(screen.getByText('Av. Libertador')).toBeTruthy();
    expect(screen.getByText('Av. Bolivar')).toBeTruthy();
  });

  it('calls onSelect and onValueChange when a suggestion is clicked', async () => {
    const suggestion = makeSuggestion({ id: 's1', primary: 'Av. Libertador', secondary: 'Caracas' });
    const onSearch = vi.fn<GeoSearchFn>();
    onSearch.mockResolvedValue([suggestion]);
    const onSelect = vi.fn();
    const onValueChange = vi.fn();
    render(<Harness onSearch={onSearch} onSelect={onSelect} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ave' } });
    await advanceDebounce();

    fireEvent.click(screen.getByRole('option', { name: /Av\. Libertador/i }));

    expect(onSelect).toHaveBeenCalledWith(suggestion);
    expect(onValueChange).toHaveBeenCalledWith('Av. Libertador');
  });

  it('selects the first suggestion with ArrowDown then Enter', async () => {
    const suggestions = [
      makeSuggestion({ id: 's1', primary: 'Primera Opcion', secondary: 'A' }),
      makeSuggestion({ id: 's2', primary: 'Segunda Opcion', secondary: 'B' }),
    ];
    const onSearch = vi.fn<GeoSearchFn>();
    onSearch.mockResolvedValue(suggestions);
    const onSelect = vi.fn();
    render(<Harness onSearch={onSearch} onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'opc' } });
    await advanceDebounce();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(suggestions[0]);
  });

  it('ignores a stale resolution that arrives after a newer query', async () => {
    const older = deferred<GeoSuggestion[]>();
    const newer = deferred<GeoSuggestion[]>();
    const onSearch = vi.fn<GeoSearchFn>();
    onSearch.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    render(<Harness onSearch={onSearch} />);

    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'cara' } });
    await advanceDebounce();
    expect(onSearch).toHaveBeenNthCalledWith(1, 'cara');

    fireEvent.change(input, { target: { value: 'carac' } });
    await advanceDebounce();
    expect(onSearch).toHaveBeenNthCalledWith(2, 'carac');

    // The newer query resolves first and is rendered.
    await act(async () => {
      newer.resolve([makeSuggestion({ id: 'new', primary: 'Resultado Nuevo', secondary: 'nuevo' })]);
    });
    expect(screen.getByText('Resultado Nuevo')).toBeTruthy();

    // The older query resolves afterwards and must not overwrite the newer one.
    await act(async () => {
      older.resolve([makeSuggestion({ id: 'old', primary: 'Resultado Viejo', secondary: 'viejo' })]);
    });
    expect(screen.queryByText('Resultado Viejo')).toBeNull();
    expect(screen.getByText('Resultado Nuevo')).toBeTruthy();
  });
});
