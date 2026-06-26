// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Stub out the lazy map picker so Leaflet never loads in jsdom.
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/app/actions', () => ({
  createLocationAction: vi.fn(),
}));

vi.mock('@/app/geocode-actions', () => ({
  geocodeReverseAction: vi.fn(),
}));

vi.mock('@/lib/data/supabase-browser', () => ({
  getBrowserSupabase: () => null,
}));

import ReportLocationForm from '@/components/report-location-form';

afterEach(() => {
  cleanup();
});

describe('ReportLocationForm - severity select', () => {
  it('renders exactly 5 status options', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Estado estructural/i });
    expect(select.querySelectorAll('option').length).toBe(5);
  });

  it('includes a "desconocido" (no-info) option', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Estado estructural/i });
    const values = Array.from(select.querySelectorAll('option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(values).toContain('desconocido');
  });

  it('defaults to "desconocido" (no severe status pre-selected)', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Estado estructural/i }) as HTMLSelectElement;
    expect(select.value).toBe('desconocido');
  });
});

describe('ReportLocationForm - personas_atrapadas radio group', () => {
  it('renders an accessible group labeled "Personas atrapadas"', () => {
    render(<ReportLocationForm />);
    const group = screen.getByRole('group', { name: /Personas atrapadas/i });
    expect(group).toBeTruthy();
  });

  it('provides three radio options (si, no, no_se)', () => {
    render(<ReportLocationForm />);
    const group = screen.getByRole('group', { name: /Personas atrapadas/i });
    const radios = Array.from(group.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    const values = radios.map((r) => r.value);
    expect(values).toContain('si');
    expect(values).toContain('no');
    expect(values).toContain('no_se');
  });

  it('defaults to "no_se"', () => {
    render(<ReportLocationForm />);
    const group = screen.getByRole('group', { name: /Personas atrapadas/i });
    const radios = Array.from(group.querySelectorAll('input[type="radio"]')) as HTMLInputElement[];
    const checked = radios.find((r) => r.checked);
    expect(checked?.value).toBe('no_se');
  });
});
