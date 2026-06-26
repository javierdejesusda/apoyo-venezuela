// @vitest-environment jsdom
/**
 * Tests for the fuente_reporte and tipo_construccion form fields
 * added to ReportLocationForm in PR7.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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

describe('ReportLocationForm - fuente_reporte select', () => {
  it('renders a "Fuente del reporte" select', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Fuente del reporte/i });
    expect(select).toBeTruthy();
  });

  it('includes a leading empty option and 5 fuente options (6 total)', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Fuente del reporte/i });
    expect(select.querySelectorAll('option').length).toBe(6);
  });

  it('contains all 5 fuente values', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Fuente del reporte/i });
    const values = Array.from(select.querySelectorAll('option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(values).toContain('vecino');
    expect(values).toContain('video');
    expect(values).toContain('noticia');
    expect(values).toContain('organismo');
    expect(values).toContain('otro');
  });

  it('defaults to an empty selection (optional)', () => {
    render(<ReportLocationForm />);
    const select = screen.getByRole('combobox', { name: /Fuente del reporte/i }) as HTMLSelectElement;
    expect(select.value).toBe('');
  });
});

describe('ReportLocationForm - tipo_construccion input', () => {
  it('renders a "Tipo de construcción" text input', () => {
    render(<ReportLocationForm />);
    const input = screen.getByRole('textbox', { name: /Tipo de construcción/i });
    expect(input).toBeTruthy();
  });

  it('has a maxLength of 200', () => {
    render(<ReportLocationForm />);
    const input = screen.getByRole('textbox', { name: /Tipo de construcción/i }) as HTMLInputElement;
    expect(input.maxLength).toBe(200);
  });

  it('defaults to empty (optional)', () => {
    render(<ReportLocationForm />);
    const input = screen.getByRole('textbox', { name: /Tipo de construcción/i }) as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
