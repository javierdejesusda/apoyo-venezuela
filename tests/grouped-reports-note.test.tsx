// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { GroupedReportsNote } from '@/components/grouped-reports-note';

afterEach(() => {
  cleanup();
});

describe('GroupedReportsNote', () => {
  it('explains the info is grouped from N reports when memberCount > 1', () => {
    render(<GroupedReportsNote memberCount={3} />);
    const note = screen.getByText(/agrupada/i);
    expect(note.textContent).toContain('3');
    expect(note.textContent?.toLowerCase()).toContain('reportes');
  });

  it('renders nothing for a single-member zone', () => {
    const { container } = render(<GroupedReportsNote memberCount={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no cluster (count of 0)', () => {
    const { container } = render(<GroupedReportsNote memberCount={0} />);
    expect(container.firstChild).toBeNull();
  });
});
