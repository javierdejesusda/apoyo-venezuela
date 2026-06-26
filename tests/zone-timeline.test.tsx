// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ZoneTimeline } from '@/components/zone-timeline';
import type { TimelineEntry } from '@/lib/data/types';

afterEach(() => {
  cleanup();
});

function makeEntry(overrides: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: 'e1',
    kind: 'report_added',
    note: null,
    createdAt: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('ZoneTimeline', () => {
  it('renders heading "Historial de actualizaciones"', () => {
    render(<ZoneTimeline entries={[makeEntry()]} />);
    expect(screen.getByText('Historial de actualizaciones')).toBeTruthy();
  });

  it('renders first report_added entry labelled "Reporte inicial"', () => {
    render(<ZoneTimeline entries={[makeEntry({ kind: 'report_added' })]} />);
    expect(screen.getByText('Reporte inicial')).toBeTruthy();
  });

  it('renders merged_duplicate entry labelled "Agrupado con un reporte similar"', () => {
    render(
      <ZoneTimeline
        entries={[
          makeEntry({ id: 'e1', createdAt: '2026-06-01T00:00:00Z', kind: 'report_added' }),
          makeEntry({ id: 'e2', createdAt: '2026-06-02T00:00:00Z', kind: 'merged_duplicate' }),
        ]}
      />,
    );
    expect(screen.getByText('Agrupado con un reporte similar')).toBeTruthy();
  });

  it('renders entries in chronological order (ascending by createdAt)', () => {
    render(
      <ZoneTimeline
        entries={[
          makeEntry({ id: 'e2', createdAt: '2026-06-03T00:00:00Z', kind: 'status_changed' }),
          makeEntry({ id: 'e1', createdAt: '2026-06-01T00:00:00Z', kind: 'report_added' }),
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    const datetimes = items.map((li) => li.querySelector('time')?.getAttribute('datetime'));
    expect(datetimes[0]).toBe('2026-06-01T00:00:00Z');
    expect(datetimes[1]).toBe('2026-06-03T00:00:00Z');
  });

  it('each entry has a <time> element with a datetime attribute', () => {
    render(
      <ZoneTimeline
        entries={[makeEntry({ id: 'e1', createdAt: '2026-06-01T12:00:00Z' })]}
      />,
    );
    const timeEl = document.querySelector('time');
    expect(timeEl).not.toBeNull();
    expect(timeEl?.getAttribute('datetime')).toBe('2026-06-01T12:00:00Z');
  });
});
