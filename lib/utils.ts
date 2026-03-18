import { clsx, type ClassValue } from 'clsx';
import { twMerge }               from 'tailwind-merge';
import type { Tier, Language }   from './types';
import { TIER_LABELS }           from './constants';

// Tailwind class merger — standard shadcn/ui pattern
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Format a date string to DD.MM.YYYY HH:mm (IDSS locale)
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

// Get tier label in the correct language
export function getTierLabel(tier: Tier, language: Language): string {
  const langKey = language === 'bosnian' ? 'bs'
                : language === 'german'  ? 'de'
                : 'en';
  return TIER_LABELS[tier][langKey];
}

// Derive tier from duration in minutes
export function deriveTier(durationMin: number): Tier {
  if (durationMin <= 45) return 'MICRO';
  if (durationMin <= 90) return 'STANDARD';
  return 'EXTENDED';
}

// Truncate text to maxLength with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

// Generate a random hex string of given byte length
// Used for request IDs (not for cryptographic purposes)
export function randomHex(bytes: number = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  }
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
