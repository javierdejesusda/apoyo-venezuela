/**
 * Pure helpers for the map hover-preview card: text trimming and viewport-aware
 * placement. Kept free of DOM/Leaflet so the positioning logic is unit-testable.
 */

/** Trims text to a length, breaking on a word boundary and adding an ellipsis. */
export function excerpt(text: string | undefined, maxLen: number): string {
  const trimmed = (text ?? '').trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export type PreviewPlacement = 'above' | 'below';

export interface PlacementInput {
  /** Anchor point (the pin) in container pixels. */
  anchor: { x: number; y: number };
  /** Rendered card size in pixels. */
  card: { width: number; height: number };
  /** Map container size in pixels. */
  viewport: { width: number; height: number };
  /** Gap between the anchor and the card. */
  gap: number;
}

export interface PlacementResult {
  left: number;
  top: number;
  placement: PreviewPlacement;
}

/** Minimum distance the card keeps from the viewport edges. */
const EDGE_PAD = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Places the card centered above the anchor, flipping below when there is not
 * enough room, and clamps it inside the viewport so it never spills off-screen.
 */
export function computePreviewPlacement({
  anchor,
  card,
  viewport,
  gap,
}: PlacementInput): PlacementResult {
  let placement: PreviewPlacement = 'above';
  let top = anchor.y - gap - card.height;
  if (top < EDGE_PAD) {
    placement = 'below';
    top = anchor.y + gap;
  }

  const left = clamp(
    anchor.x - card.width / 2,
    EDGE_PAD,
    viewport.width - card.width - EDGE_PAD,
  );
  top = clamp(top, EDGE_PAD, viewport.height - card.height - EDGE_PAD);

  return { left, top, placement };
}
