import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Build a `tel:` href that preserves Venezuelan short codes (911, 171, *1)
 * while stripping spaces, dashes and parentheses from full numbers.
 */
export function telHref(phone: string): string {
  const cleaned = phone.replace(/[^\d*#+]/g, '');
  return `tel:${cleaned}`;
}

/** Human, Spanish relative time. `now` is injectable for deterministic tests. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = now.getTime() - then;
  if (diffMs < 0) return 'recien';
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return 'hace un momento';
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const days = Math.round(hr / 24);
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} dias`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.round(months / 12);
  return `hace ${years} ${years === 1 ? 'ano' : 'anos'}`;
  // Note: accent-free relative units keep the unit test ASCII-stable.
}

/** Collision-resistant id that works on both server and client. */
export function createId(prefix = 'id'): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return `${prefix}_${uuid}`;
  const rnd = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rnd}`;
}
