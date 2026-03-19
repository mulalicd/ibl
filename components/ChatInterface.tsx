'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn, randomHex, deriveTier }                from '@/lib/utils';
import { SUBJECTS, SUBJECT_GROUPS }                 from '@/lib/constants';
import LoadingIndicator                              from './LoadingIndicator';
import PlanDisplay                                   from './PlanDisplay';
import GeminiStatusBar                              from './GeminiStatusBar';
import DocxExportButton                             from './DocxExportButton';
import type {
  ChatMessage, ConversationState, OnboardingState,
  Language, GenerateResponse,
} from '@/lib/types';

const INITIAL_ONBOARDING: OnboardingState = {
  step: 0, language: 'bosnian', subject: '', grade: 1,
  topic: '', duration_min: 90, prior_knowledge: '', notes: '', confirmed: false,
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: `Dobrodošli u IBL Planer! 🎓

Ja sam vaš AI asistent za kreiranje planova časa zasnovanim na istraživačkom učenju (IBL) za Internationale Deutsche Schule Sarajevo.

Kako mogu pomoći?

  1. Kreirajte novi IBL plan časa
  2. Unesite direktno: naziv predmeta, razred, temu i trajanje
     Primjer: "Matematika, 5. razred, Razlomci, 90 minuta"

Za početak — recite mi za koji predmet i razred trebate plan.`,
  timestamp: new Date().toISOString(),
};

export default function ChatInterface() {
  const [conv, setConv]     = useState<ConversationState>({
    mode: 'onboarding', messages: [WELCOME_MESSAGE],
    activePlanId: null, activePlan: null, isLoading: false, error: null,
  });
  const [input, setInput]   = useState('');
  const [onb, setOnb]       = useState<OnboardingState>(INITIAL_ONBOARDING);
  const bottomRef           = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages, conv.isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setConv(prev => ({
      ...prev,
      messages: [...prev.messages, {
        ...msg, id: randomHex(8), timestamp: new Date().toISOString(),
      }],
    }));
  }, []);

  async function sendToAPI(mode: 'onboarding' | 'generate' | 'chat', payload: object) {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'Greška pri komunikaciji s AI-om.');
    }
    return res.json() as Promise<GenerateResponse>;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || conv.isLoading) return;
    setInput('');

    addMessage({ role: 'user', content: text });
    setConv(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (conv.mode === 'chat' && conv.activePlan) {
        // MODE C — post-generation conversation
        const history = conv.messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.role, content: m.content }));

        const data = await sendToAPI('chat', {
          mode: 'chat',
          messages: [...history, { role: 'user', content: text }],
          plan_id:      conv.activePlanId,
          plan_context: conv.activePlan,
        });

        addMessage({ role: 'model', content: data.text });

      } else {
        // MODE A/B — onboarding or direct generation
        const history = conv.messages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.role, content: m.content }));

        const data = await sendToAPI('onboarding', {
          mode: 'onboarding',
          messages: [...history, { role: 'user', content: text }],
        });

        // Check if response contains a complete plan (heuristic)
        const isPlan = data.text.includes('ISTRAŽIVAČKO PITANJE') ||
                       data.text.includes('FORSCHUNGSFRAGE') ||
                       data.text.includes('INQUIRY QUESTION');

        if (isPlan) {
          setConv(prev => ({
            ...prev,
            mode:         'chat',
            activePlan:   data.text,
            activePlanId: data.plan_id ?? null,
            isLoading:    false,
            messages: [...prev.messages, {
              id:        randomHex(8),
              role:      'model',
              content:   data.text,
              isPlan:    true,
              plan_id:   data.plan_id ?? undefined,
              timestamp: new Date().toISOString(),
            }],
          }));
          return;
        }

        addMessage({ role: 'model', content: data.text });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Neočekivana greška.';
      setConv(prev => ({ ...prev, error: msg }));
      addMessage({ role: 'model', content: `⚠️ ${msg}` });
    } finally {
      setConv(prev => ({ ...prev, isLoading: false }));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {conv.messages.map(msg => (
          <div key={msg.id} className={cn(
            'flex gap-3 animate-fadeIn',
            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
          )}>
            {/* Avatar */}
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
              msg.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-accent text-gray-900',
            )}>
              {msg.role === 'user' ? 'Vi' : 'AI'}
            </div>

            {/* Bubble */}
            <div className={cn(
              'max-w-[80%] rounded-2xl px-4 py-3',
              msg.role === 'user'
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm',
            )}>
              {msg.isPlan ? (
                <div className="space-y-3">
                  <PlanDisplay planText={msg.content} planId={msg.plan_id} />
                  {msg.plan_id && (
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                      <DocxExportButton planId={msg.plan_id} />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {conv.isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center
                            justify-center text-xs font-bold text-gray-900 flex-shrink-0">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm
                            shadow-sm px-4 py-3">
              <LoadingIndicator message="Gemini procesira..." />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions when in chat mode */}
      {conv.mode === 'chat' && !conv.isLoading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {[
            'Kako mogu poboljšati udicu?',
            'Predloži alternativno istraživačko pitanje',
            'Kako prilagoditi za slabije učenike?',
            'Koje dodatne aktivnosti preporučuješ?',
          ].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200
                         bg-white text-gray-600 hover:border-primary/40
                         hover:text-primary hover:bg-blue-50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              conv.mode === 'chat'
                ? 'Postavite pitanje o ovom planu...'
                : 'Napišite predmet, razred, temu... ili postavite pitanje'
            }
            disabled={conv.isLoading}
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3
                       text-sm bg-white focus:outline-none focus:ring-2
                       focus:ring-primary/20 focus:border-primary transition-all
                       disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '48px' }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || conv.isLoading}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary text-white
                       flex items-center justify-center hover:bg-primary/90
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter za slanje · Shift+Enter za novi red · PSI v8.0
        </p>
      </div>
    </div>
  );
}