// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModeTabs } from '@/components/mode-tabs';

afterEach(() => {
  cleanup();
});

describe('ModeTabs', () => {
  it('renders a button group with the correct aria-label', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={5} danosCount={10} />);
    expect(screen.getByRole('group', { name: /Modo del explorador/i })).toBeInTheDocument();
  });

  it('marks the ayuda button as pressed when mode is ayuda', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={5} danosCount={10} />);
    const ayudaBtn = screen.getByRole('button', { name: /Pedidos/i });
    const danosBtn = screen.getByRole('button', { name: /Da[ñn]/i });
    expect(ayudaBtn).toHaveAttribute('aria-pressed', 'true');
    expect(danosBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('marks the danos button as pressed when mode is danos', () => {
    render(<ModeTabs mode="danos" onChange={vi.fn()} ayudaCount={5} danosCount={10} />);
    const danosBtn = screen.getByRole('button', { name: /Da[ñn]/i });
    const ayudaBtn = screen.getByRole('button', { name: /Pedidos/i });
    expect(danosBtn).toHaveAttribute('aria-pressed', 'true');
    expect(ayudaBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with "danos" when the danos button is clicked', () => {
    const onChange = vi.fn();
    render(<ModeTabs mode="ayuda" onChange={onChange} ayudaCount={5} danosCount={10} />);
    fireEvent.click(screen.getByRole('button', { name: /Da[ñn]/i }));
    expect(onChange).toHaveBeenCalledWith('danos');
  });

  it('calls onChange with "ayuda" when the ayuda button is clicked', () => {
    const onChange = vi.fn();
    render(<ModeTabs mode="danos" onChange={onChange} ayudaCount={5} danosCount={10} />);
    fireEvent.click(screen.getByRole('button', { name: /Pedidos/i }));
    expect(onChange).toHaveBeenCalledWith('ayuda');
  });

  it('shows ayudaCount in the pedidos button', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={7} danosCount={3} />);
    expect(screen.getByRole('button', { name: /Pedidos/i }).textContent).toContain('7');
  });

  it('shows danosCount in the danos button', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={7} danosCount={3} />);
    expect(screen.getByRole('button', { name: /Da[ñn]/i }).textContent).toContain('3');
  });

  it('has a single aria-label on the group container', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={0} danosCount={0} />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label', 'Modo del explorador');
  });

  it('uses singular "zona" in the badge aria-label when count is 1', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={1} danosCount={5} />);
    // The ayuda badge aria-label should read "1 zona" not "1 zonas".
    expect(screen.getByLabelText('1 zona')).toBeInTheDocument();
  });

  it('uses plural "zonas" in the badge aria-label when count is not 1', () => {
    render(<ModeTabs mode="ayuda" onChange={vi.fn()} ayudaCount={2} danosCount={1} />);
    expect(screen.getByLabelText('2 zonas')).toBeInTheDocument();
    expect(screen.getByLabelText('1 zona')).toBeInTheDocument();
  });
});
