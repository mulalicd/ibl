'use client';
import Link from 'next/link';
import { cn, formatDate, truncate } from '@/lib/utils';
import { TIER_COLORS, TIER_LABELS } from '@/lib/constants';
import type { PlanCardData } from '@/lib/types';

interface PlanCardProps { plan: PlanCardData; className?: string; }

export default function PlanCard({ plan, className }: PlanCardProps) {
  const langKey   = plan.language === 'bosnian' ? 'bs' : plan.language === 'german' ? 'de' : 'en';
  const tierLabel = TIER_LABELS[plan.tier][langKey];
  return (
    <Link href={`/plan/${plan.id}`}
      className={cn('group block bg-white rounded-2xl border border-gray-200 p-6',
        'hover:border-primary/40 hover:shadow-lg transition-all duration-200', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-primary bg-blue-50 px-2.5 py-1 rounded-full border border-primary/20">
            {plan.subject}
          </span>
          <span className="text-xs text-gray-400 font-medium">{plan.grade}. razred</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', TIER_COLORS[plan.tier])}>
            {tierLabel}
          </span>
          {plan.is_favourite && <span className="text-amber-400">★</span>}
        </div>
      </div>
      <h3 className="font-serif text-gray-900 text-base leading-snug mb-3 group-hover:text-primary transition-colors">
        {truncate(plan.topic, 70)}
      </h3>
      {plan.inquiry_question && (
        <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg px-3 py-2 mb-4">
          <p className="text-xs text-gray-600 italic leading-relaxed">
            {truncate(plan.inquiry_question, 90)}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">{formatDate(plan.created_at)}</p>
    </Link>
  );
}