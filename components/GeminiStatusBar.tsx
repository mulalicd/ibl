'use client';

import { cn }                        from '@/lib/utils';
import { TIER_COLORS, TIER_LABELS }  from '@/lib/constants';
import type { Tier, Language }       from '@/lib/types';

interface GeminiStatusBarProps {
  tier:        Tier;
  language:    Language;
  durationMs?: number;
  keyIndex?:   number;
  className?:  string;
}

export default function GeminiStatusBar({
  tier, language, durationMs, keyIndex, className,
}: GeminiStatusBarProps) {
  const langKey   = language === 'bosnian' ? 'bs' : language === 'german' ? 'de' : 'en';
  const tierLabel = TIER_LABELS[tier][langKey];
  const seconds   = durationMs ? (durationMs / 1000).toFixed(1) : null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', TIER_COLORS[tier])}>
        {tierLabel}
      </span>
      {seconds && (
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
          ⏱ {seconds}s
        </span>
      )}
      {keyIndex !== undefined && (
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
          Gemini #{keyIndex + 1}
        </span>
      )}
      <span className="text-xs text-gray-400">· PSI v8.0</span>
    </div>
  );
}