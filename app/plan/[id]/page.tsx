'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link                      from 'next/link';
import PlanDisplay               from '@/components/PlanDisplay';
import GeminiStatusBar           from '@/components/GeminiStatusBar';
import DocxExportButton          from '@/components/DocxExportButton';
import LoadingIndicator          from '@/components/LoadingIndicator';
import { formatDate }            from '@/lib/utils';
import type { PlanRecord }       from '@/lib/types';

export default function PlanPage() {
  const params            = useParams();
  const router            = useRouter();
  const [plan, setPlan]   = useState<PlanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    fetch(`/api/plans/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Plan nije pronađen.');
        return r.json();
      })
      .then(setPlan)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  async function toggleFavourite() {
    if (!plan) return;
    const next = !plan.is_favourite;
    setPlan(prev => prev ? { ...prev, is_favourite: next } : prev);
    await fetch(`/api/plans/${plan.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_favourite: next }),
    }).catch(() => {
      setPlan(prev => prev ? { ...prev, is_favourite: !next } : prev);
    });
  }

  async function deletePlan() {
    if (!plan) return;
    if (!confirm('Obrisati ovaj plan? Ova akcija se ne može poništiti.')) return;
    await fetch(`/api/plans/${plan.id}`, { method: 'DELETE' });
    router.push('/dashboard');
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingIndicator message="Učitavam plan..." />
    </div>
  );

  if (error || !plan) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-gray-900 font-medium mb-2">{error || 'Plan nije pronađen.'}</p>
        <Link href="/dashboard"
          className="text-sm text-primary hover:underline">
          ← Nazad na dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="text-sm text-gray-500 hover:text-primary transition-colors">
              ← Moji planovi
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">
              {plan.subject} · {plan.grade}. razred
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavourite}
              className="text-xl hover:scale-110 transition-transform"
              title={plan.is_favourite ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
            >
              {plan.is_favourite ? '★' : '☆'}
            </button>
            <DocxExportButton planId={plan.id} />
            <Link
              href={`/chat`}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                         text-gray-600 hover:border-primary/40 hover:text-primary
                         hover:bg-blue-50 transition-all"
            >
              + Novi plan
            </Link>
            <button
              onClick={deletePlan}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-400
                         hover:text-red-600 hover:bg-red-50 transition-all"
            >
              Obriši
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 animate-fadeIn">

        {/* Meta */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="font-['DM_Serif_Display'] text-2xl text-gray-900 leading-snug">
              {plan.topic}
            </h1>
            <GeminiStatusBar
              tier={plan.tier}
              language={plan.language}
              durationMs={plan.generation_time_ms ?? undefined}
              keyIndex={plan.gemini_key_index ?? undefined}
              className="flex-shrink-0"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>📚 {plan.subject}</span>
            <span>🎓 {plan.grade}. razred</span>
            <span>⏱ {plan.duration_min} min</span>
            <span>📅 {formatDate(plan.created_at)}</span>
            {plan.docx_export_count > 0 && (
              <span>⬇ Izvezeno {plan.docx_export_count}×</span>
            )}
          </div>
        </div>

        {/* Inquiry question callout */}
        {plan.inquiry_question && (
          <div className="border-l-4 border-accent bg-amber-50 rounded-r-2xl
                          px-6 py-4 mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest
                          text-amber-600 mb-2">
              Istraživačko pitanje
            </p>
            <p className="font-['DM_Serif_Display'] text-lg text-gray-900 italic">
              {plan.inquiry_question}
            </p>
          </div>
        )}

        {/* Plan text */}
        <PlanDisplay planText={plan.plan_text} planId={plan.id} />

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between">
          <Link
            href={`/chat`}
            className="text-sm text-primary hover:underline"
          >
            💬 Razgovarajte s AI-om o ovom planu
          </Link>
          <DocxExportButton planId={plan.id} />
        </div>
      </main>
    </div>
  );
}