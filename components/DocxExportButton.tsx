'use client';
import { useState } from 'react';

interface DocxExportButtonProps {
  planId: string;
  className?: string;
}

export default function DocxExportButton({ planId, className }: DocxExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleExport() {
    if (status === 'loading') return;
    setStatus('loading');

    try {
      const res = await fetch(`/api/export/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!res.ok) throw new Error('Export failed');

      // Create download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IBL_Plan_${planId.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('DOCX export error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={status === 'loading'}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        status === 'loading'
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : status === 'success'
          ? 'bg-green-100 text-green-700'
          : status === 'error'
          ? 'bg-red-100 text-red-700'
          : 'bg-primary text-white hover:bg-primary/90'
      } ${className || ''}`}
    >
      {status === 'loading' ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Izvoz...
        </span>
      ) : status === 'success' ? (
        '✓ Izvezeno!'
      ) : status === 'error' ? (
        '✕ Greška'
      ) : (
        '⬇ Izvoz u Word'
      )}
    </button>
  );
}