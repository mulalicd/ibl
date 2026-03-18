/**
 * lib/constants.ts
 * All constants from CCA Instructions Section 10.3
 * IDSS IBL Lesson Planner v2.0
 */

// ============================================================================
// 1. SUBJECTS ARRAY (23 official IDSS subjects, alphabetically)
// ============================================================================

export const SUBJECTS = [
  'B/H/S',
  'Biologie',
  'Chemie',
  'Deutsch',
  'Englisch',
  'Erdkunde',
  'Ethik',
  'Französisch',
  'Geschichte',
  'Gesellschaft',
  'Informatik',
  'Kunst',
  'Lebenskunde',
  'Mathematik',
  'Musik',
  'Nachmittagsprogramm',
  'Nacharbeit',
  'Naturkunde',
  'Physik',
  'Sachkunde',
  'Sport',
  'Technik',
  'Umweltkunde',
] as const;

// ============================================================================
// 2. SUBJECT_GROUPS (23 subjects grouped into 6 categories)
// ============================================================================

export const SUBJECT_GROUPS = [
  {
    category: 'Sprachen',
    subjects: ['B/H/S', 'Deutsch', 'Englisch', 'Französisch'],
  },
  {
    category: 'Mathematik & Naturwissenschaften',
    subjects: [
      'Biologie',
      'Chemie',
      'Mathematik',
      'Naturkunde',
      'Physik',
      'Umweltkunde',
    ],
  },
  {
    category: 'Gesellschaft & Geschichte',
    subjects: [
      'Erdkunde',
      'Ethik',
      'Geschichte',
      'Gesellschaft',
      'Lebenskunde',
      'Sachkunde',
    ],
  },
  {
    category: 'Kreativität & Bewegung',
    subjects: ['Kunst', 'Musik', 'Sport'],
  },
  {
    category: 'Technik & Digital',
    subjects: ['Informatik', 'Technik'],
  },
  {
    category: 'Schulprogramm',
    subjects: ['Nachmittagsprogramm', 'Nacharbeit'],
  },
] as const;

// ============================================================================
// 3. SUBJECT_SPECIAL_HANDLING (PSI v8.0 Module 1.5)
// ============================================================================

export const SUBJECT_SPECIAL_HANDLING = new Map<
  string,
  'school_programme' | 'interdisciplinary' | 'philosophical'
>([
  ['Nachmittagsprogramm', 'school_programme'],
  ['Nacharbeit', 'school_programme'],
  ['Lebenskunde', 'interdisciplinary'],
  ['Ethik', 'philosophical'],
]);

// ============================================================================
// 4. TIER_LABELS (three languages, three tiers)
// ============================================================================

export const TIER_LABELS = {
  MICRO: {
    bs: 'Mikro čas',
    de: 'Mikro-Stunde',
    en: 'Micro lesson',
  },
  STANDARD: {
    bs: 'Standardni čas',
    de: 'Standard-Stunde',
    en: 'Standard lesson',
  },
  EXTENDED: {
    bs: 'Produženi čas',
    de: 'Erweiterte Stunde',
    en: 'Extended lesson',
  },
} as const;

// ============================================================================
// 5. TIER_COLORS (Tailwind classes)
// ============================================================================

export const TIER_COLORS = {
  MICRO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  STANDARD: 'bg-blue-100 text-blue-800 border-blue-200',
  EXTENDED: 'bg-amber-100 text-amber-800 border-amber-200',
} as const;

// ============================================================================
// 6. LANGUAGE_LABELS
// ============================================================================

export const LANGUAGE_LABELS = {
  bosnian: 'Bosanski',
  german: 'Deutsch',
  english: 'English',
} as const;

// ============================================================================
// 7. ERROR_MESSAGES (in Bosnian — default UI language)
// ============================================================================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Sesija je istekla. Molimo prijavite se ponovo.',
  INVALID_INPUT: 'Molimo popunite sva obavezna polja ispravno.',
  RATE_LIMIT: 'Sistem je trenutno preopterećen. Sačekajte 1 minutu.',
  GENERATION_FAILED: 'Greška pri generisanju plana. Pokušajte ponovo.',
  SAVE_FAILED:
    'Plan je generisan ali nije sačuvan. Kopirajte tekst ručno.',
  NETWORK_ERROR: 'Problem s internet vezom. Provjerite konekciju.',
  NOT_FOUND: 'Plan nije pronađen.',
  EXPORT_FAILED: 'Greška pri izvozu u Word. Pokušajte ponovo.',
  ALL_KEYS_EXHAUSTED:
    'Svi API ključevi su privremeno preopterećeni.',
} as const;

// ============================================================================
// 8. SESSION_DURATION_MS constant
// ============================================================================

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

// ============================================================================
// 9. ZPD_THRESHOLDS (for deriveZpdCalibration in lib/gemini.ts)
// ============================================================================

export const ZPD_THRESHOLDS = {
  SHORT_INPUT: 30, // chars — below = BASIC prior knowledge
  MEDIUM_INPUT: 100, // chars — below = INTERMEDIATE prior knowledge
} as const;
