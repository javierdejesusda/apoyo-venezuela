// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReportLocationForm from '@/components/report-location-form';

vi.mock('@/app/actions', () => ({ createLocationAction: vi.fn() }));
vi.mock('@/app/geocode-actions', () => ({ geocodeReverseAction: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/data/supabase-browser', () => ({ getBrowserSupabase: () => null }));
vi.mock('@/components/location-picker', () => ({
  default: () => <div data-testid="location-picker" />,
}));

beforeEach(() => {
  // jsdom does not implement the object-URL APIs the preview depends on.
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
});

function selectOnePhoto(): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('ReportLocationForm photo preview', () => {
  it('shows the full selected photo without cropping its width', () => {
    render(<ReportLocationForm />);

    selectOnePhoto();

    const preview = screen.getByRole('img', { name: 'Foto adjunta 1' });
    expect(preview.className).toContain('object-contain');
    expect(preview.className).not.toContain('object-cover');
  });
});
