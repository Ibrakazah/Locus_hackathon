'use client';
import React from 'react';
import type { MatchLevel } from '@/lib/types';

export function Button({ children, onClick, variant, className = '', type }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; className?: string; type?: 'button' | 'submit';
}) {
  const base = 'font-display text-sm font-extrabold uppercase tracking-wide border-[3px] border-ink px-5 py-3 shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all w-full';
  const color = variant === 'ghost' ? 'bg-paper text-ink' : 'bg-mint text-ink';
  return <button type={type ?? 'button'} onClick={onClick} className={`${base} ${color} ${className}`}>{children}</button>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-[3px] border-ink bg-paper p-4 shadow-brutal-sm ${className}`}>{children}</div>;
}

export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${active ? 'bg-ink text-cream' : 'bg-cream text-ink'}`}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-bold">
      <span className="font-display text-xs uppercase tracking-wide">{label}</span>
      <input {...props} className="border-[3px] border-ink bg-paper px-3 py-2 text-base font-medium outline-none focus:bg-mint-soft" />
    </label>
  );
}

const LEVEL_STYLE: Record<MatchLevel, string> = {
  fits: 'bg-mint text-ink',
  close: 'bg-sun text-ink',
  fails: 'bg-paper text-danger border-danger',
};
const LEVEL_TEXT: Record<MatchLevel, string> = {
  fits: '✓ проходишь порог',
  close: '≈ близко',
  fails: '✕ не проходишь',
};

export function Badge({ kind, children }: { kind: 'source' | 'demo' | 'reach' | MatchLevel; children?: React.ReactNode }) {
  if (kind === 'source') return <span className="inline-block border-2 border-ink bg-sky-soft px-2 py-0.5 text-[11px] font-bold uppercase">источник</span>;
  if (kind === 'demo') return <span className="inline-block border-2 border-ink bg-sun px-2 py-0.5 text-[11px] font-bold uppercase">демо-данные</span>;
  if (kind === 'reach') return <span className="inline-block border-2 border-ink bg-ink px-2 py-0.5 text-[11px] font-bold uppercase text-cream">конкурсный отбор</span>;
  return <span className={`inline-block border-2 border-ink px-2 py-0.5 text-[11px] font-bold uppercase ${LEVEL_STYLE[kind]}`}>{children ?? LEVEL_TEXT[kind]}</span>;
}

export function PathIndicator({ step, total = 7, label }: { step: number; total?: number; label: string }) {
  return (
    <div className="border-[3px] border-ink bg-paper px-4 py-2 shadow-brutal-xs">
      <p className="font-display text-xs font-extrabold uppercase tracking-wide">Шаг {step} из {total} · {label}</p>
      <div className="mt-1 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 border border-ink ${i < step ? 'bg-mint' : 'bg-cream'}`} />
        ))}
      </div>
    </div>
  );
}

export function TaskCard({ title, deadline, done, onToggle, source }: {
  title: string; deadline: string | null; done: boolean; onToggle: () => void; source: string;
}) {
  return (
    <div className={`border-[3px] p-4 shadow-brutal-sm ${done ? 'border-smoke bg-cream opacity-70' : 'border-ink bg-paper'}`}>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={done} onChange={onToggle} className="mt-1 h-5 w-5 accent-black" />
        <span>
          <span className={`font-bold ${done ? 'line-through' : ''}`}>{title}</span>
          <span className="mt-1 block text-xs font-medium text-smoke">
            {deadline ? `до ${deadline.slice(0, 10)} · ` : ''}{source}
          </span>
        </span>
      </label>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-auto border-[3px] border-ink bg-cream p-5 shadow-brutal" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-extrabold uppercase">{title}</h3>
          <button onClick={onClose} className="border-2 border-ink bg-paper px-2 py-1 text-sm font-bold">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Skeleton() {
  return <div className="animate-pulse border-[3px] border-ink bg-cream p-4">Загрузка…</div>;
}
