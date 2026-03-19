'use client';

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({
  message = 'Gemini analizira i gradi plan časa...',
}: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 animate-fadeIn">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-2 border-primary
                        border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full border-2 border-accent/30
                        border-b-transparent animate-spin [animation-direction:reverse]
                        [animation-duration:1.5s]" />
      </div>
      <div className="text-center space-y-2">
        <p className="font-['DM_Serif_Display'] text-xl text-gray-900">{message}</p>
        <p className="text-sm text-gray-400">
          Protokoli 1 → 2 → 3 u toku · 15–45 sekundi
        </p>
      </div>
    </div>
  );
}