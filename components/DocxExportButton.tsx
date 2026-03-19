'use client';
interface DocxExportButtonProps { planId: string; className?: string; }
export default function DocxExportButton({ planId, className }: DocxExportButtonProps) {
  return (
    <button className={className} onClick={() => {}}>
      ⬇ Izvoz u Word
    </button>
  );
}