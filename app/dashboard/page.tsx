'use client';

import { useState, useEffect } from 'react';
import Link                    from 'next/link';
import PlanCard                from '@/components/PlanCard';
import { SUBJECTS, TIER_LABELS } from '@/lib/constants';
import type { PlanCardData, DashboardFilters } from '@/lib/types';

const INITIAL_FILTERS: DashboardFilters = {
  subject: '', grade: undefined, language: undefined, tier: undefined,
  isFavourite: false, searchQuery: '', sortBy: 'created_at', sortOrder: 'desc',
};

export default function DashboardPage() {
  const [plans, setPlans]       = useState<PlanCardData[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState<DashboardFilters>(INITIAL_FILTERS);

  useEffect(() => {
    fetchPlans();
  }, [page, filters]);

  async function fetchPlans() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page',  String(page));
      params.set('limit', '12');
      if (filters.subject)     params.set('subject',    filters.subject);
      if (filters.grade)       params.set('grade',      String(filters.grade));
      if (filters.tier)        params.set('tier',       filters.tier);
      if (filters.isFavourite) params.set('favourites', 'true');
      if (filters.searchQuery) params.set('search',     filters.searchQuery);

      const res  = await fetch(`/api/plans?${params}`);
      const data = await res.json();
      setPlans(data.plans ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function setFilter<K extends keyof DashboardFilters>(key: K, val: DashboardFilters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center
                            justify-center text-white text-xs font-bold">
              IBL
            </div>
            <h1 className="text-sm font-semibold text-gray-900">Moji IBL planovi</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-primary text-white text-sm font-medium
                         hover:bg-primary/90 transition-colors"
            >
              <span>+</span> Novi plan
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit"
                className="text-xs text-gray-500 hover:text-red-600
                           px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Odjava
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6
                        flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Pretraži planove..."
            value={filters.searchQuery}
            onChange={e => setFilter('searchQuery', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/20
                       focus:border-primary w-48"
          />
          <select
            value={filters.subject}
            onChange={e => setFilter('subject', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/20
                       focus:border-primary bg-white"
          >
            <option value="">Svi predmeti</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.grade ?? ''}
            onChange={e => setFilter('grade', e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/20
                       focus:border-primary bg-white"
          >
            <option value="">Svi razredi</option>
            {Array.from({length: 9}, (_, i) => i + 1).map(g => (
              <option key={g} value={g}>{g}. razred</option>
            ))}
          </select>
          <select
            value={filters.tier ?? ''}
            onChange={e => setFilter('tier', (e.target.value as DashboardFilters['tier']) || undefined)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/20
                       focus:border-primary bg-white"
          >
            <option value="">Svi tipovi</option>
            <option value="MICRO">Mikro čas</option>
            <option value="STANDARD">Standardni čas</option>
            <option value="EXTENDED">Produženi čas</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isFavourite}
              onChange={e => setFilter('isFavourite', e.target.checked)}
              className="rounded border-gray-300 text-primary
                         focus:ring-primary/20"
            />
            Samo omiljeni
          </label>
          {(filters.subject || filters.grade || filters.tier ||
            filters.isFavourite || filters.searchQuery) && (
            <button
              onClick={() => { setFilters(INITIAL_FILTERS); setPage(1); }}
              className="text-xs text-gray-500 hover:text-red-600
                         px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              ✕ Resetuj filtere
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">
            {total} {total === 1 ? 'plan' : 'planova'}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200
                                      h-48 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-['DM_Serif_Display'] text-xl text-gray-900 mb-2">
              Nema planova
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {filters.searchQuery || filters.subject || filters.grade
                ? 'Nema rezultata za odabrane filtere.'
                : 'Kreirajte prvi IBL plan časa.'}
            </p>
            <Link href="/chat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                         bg-primary text-white text-sm font-medium
                         hover:bg-primary/90 transition-colors">
              + Novi plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm
                         text-gray-600 hover:border-primary/40 hover:text-primary
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all bg-white"
            >
              ← Prethodna
            </button>
            <span className="text-sm text-gray-500 px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm
                         text-gray-600 hover:border-primary/40 hover:text-primary
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all bg-white"
            >
              Sljedeća →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}