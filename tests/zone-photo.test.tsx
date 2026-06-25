// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZonePhoto } from '@/components/zone-photo';

describe('ZonePhoto', () => {
  it('renders the image with the given src and alt', () => {
    render(<ZonePhoto src="https://x.supabase.co/a.jpg" alt="Foto de la zona Centro" />);
    const img = screen.getByRole('img', { name: 'Foto de la zona Centro' });
    expect(img).toHaveAttribute('src', 'https://x.supabase.co/a.jpg');
  });

  it('shows a layout-preserving fallback when the image fails to load', () => {
    render(<ZonePhoto src="https://x.supabase.co/a.jpg" alt="Foto de la zona Centro" />);
    fireEvent.error(screen.getByRole('img', { name: 'Foto de la zona Centro' }));

    expect(screen.queryByRole('img', { name: 'Foto de la zona Centro' })).toBeNull();
    const fallback = screen.getByRole('img', { name: /no disponible/i });
    expect(fallback.className).toContain('aspect-square');
  });
});
