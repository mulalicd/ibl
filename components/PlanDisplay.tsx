'use client';

import { useState } from 'react';
import { cn }       from '@/lib/utils';

interface PlanDisplayProps {
  planText:   string;
  planId?:    string;
  className?: string;
}

export default function PlanDisplay({ planText, planId, className }: PlanDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(planText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn('relative group', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Plan časa
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                     bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50
                     transition-all duration-150 font-medium"
        >
          {copied ? '✓ Kopirano' : 'Kopiraj'}
        </button>
      </div>
      <pre
        id={planId ? `plan-${planId}` : undefined}
        className="w-full overflow-x-auto whitespace-pre font-['JetBrains_Mono']
                   text-sm leading-relaxed bg-gray-950 text-gray-100
                   rounded-2xl p-6 border border-gray-800"
      >
        {planText}
      </pre>
    </div>
  );
}