// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ZonePhotoGallery } from '@/components/zone-photo-gallery';

const FOTOS = [
  'https://x.supabase.co/storage/v1/object/public/fotos/a.jpg',
  'https://x.supabase.co/storage/v1/object/public/fotos/b.jpg',
];

afterEach(cleanup);

describe('ZonePhotoGallery', () => {
  it('renders one thumbnail button per photo', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    expect(screen.getAllByRole('button', { name: /ampliar foto/i })).toHaveLength(2);
  });

  it('does not render the lightbox until a thumbnail is clicked', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the full, uncropped photo in a dialog on click', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    fireEvent.click(screen.getAllByRole('button', { name: /ampliar foto/i })[1]);

    expect(screen.getByRole('dialog')).toBeTruthy();
    const full = screen.getByRole('img', { name: /ampliada/i });
    expect(full.getAttribute('src')).toContain('/render/image/public/fotos/b.jpg');
    expect(full.getAttribute('src')).toContain('width=1600');
    expect(full.className).toContain('object-contain');
  });

  it('moves focus to the close button when opened', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    fireEvent.click(screen.getAllByRole('button', { name: /ampliar foto/i })[0]);
    expect(screen.getByRole('button', { name: /cerrar foto/i })).toHaveFocus();
  });

  it('closes with the close button', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    fireEvent.click(screen.getAllByRole('button', { name: /ampliar foto/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /cerrar foto/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes when Escape is pressed', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    fireEvent.click(screen.getAllByRole('button', { name: /ampliar foto/i })[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('locks body scroll while open and restores it on close', () => {
    render(<ZonePhotoGallery fotos={FOTOS} zoneName="Centro" />);
    fireEvent.click(screen.getAllByRole('button', { name: /ampliar foto/i })[0]);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: /cerrar foto/i }));
    expect(document.body.style.overflow).toBe('');
  });
});
