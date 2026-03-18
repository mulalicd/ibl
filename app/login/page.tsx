'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter }                    from 'next/navigation';

export default function LoginPage() {
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || pin.length < 4) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin }),
      });

      if (res.ok) {
        const params   = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') ?? '/chat';
        router.push(redirect);
      } else {
        const data = await res.json();
        if (res.status === 401) {
          setError('Pogrešan PIN. Pokušajte ponovo.');
        } else {
          setError(data.message ?? 'Greška pri prijavi. Pokušajte ponovo.');
        }
        setPin('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Problem s internet vezom. Provjerite konekciju.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-white text-2xl font-bold">IBL</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">
            PLANER ZA IBL LEKCIJU
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Internationale Deutsche Schule Sarajevo
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                PIN pristupni kod
              </label>
              <input
                ref={inputRef}
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                disabled={loading}
                className="w-full text-center text-3xl tracking-widest font-mono
                           border border-gray-300 rounded-xl px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-primary
                           focus:border-transparent disabled:opacity-50
                           placeholder:text-gray-300"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50
                            rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-primary text-white font-semibold py-3
                         rounded-xl hover:bg-blue-900 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Provjera...' : 'Pristupi'}
            </button>

          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          IBL Planer v2.0 · PSI v8.0
        </p>
      </div>
    </div>
  );
}
