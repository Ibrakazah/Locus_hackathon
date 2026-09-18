'use client';
import React from 'react';
import type { MatchLevel } from '@/lib/types';

export function Button({ children, onClick, variant, className = '', type }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; className?: string; type?: 'button' | 'submit';
}) {
  const base = 'inline-flex w-full items-center justify-center whitespace-nowrap rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
  const color = variant === 'ghost'
    ? 'glass text-foreground hover:bg-white/10'
    : 'btn-glow bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:brightness-110';
  return <button type={type ?? 'button'} onClick={onClick} className={`${base} ${color} ${className}`}>{children}</button>;
}

export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`glass rounded-3xl p-5 ${className}`}>{children}</div>;
}

export function Chip({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
        active
          ? 'border-violet-400/60 bg-violet-500/20 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.35)]'
          : 'glass text-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function Input({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      <input
        {...props}
        className="glass min-h-[44px] rounded-2xl px-4 py-2.5 text-base font-medium text-foreground outline-none transition-all placeholder:text-faint focus:border-violet-400/60 focus:shadow-[0_0_16px_rgba(139,92,246,0.25)]"
      />
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

const LEVEL_STYLE: Record<MatchLevel, string> = {
  fits: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
  close: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
  fails: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
};
const LEVEL_TEXT: Record<MatchLevel, string> = {
  fits: '✨ Проходишь порог',
  close: '🎯 Близко',
  fails: '🌧️ Не проходишь',
};

export function Badge({ kind, children }: { kind: 'source' | 'demo' | 'reach' | MatchLevel; children?: React.ReactNode }) {
  if (kind === 'source') return <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-muted">🔗 Источник</span>;
  if (kind === 'demo') return <span className="inline-block rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-300">🧪 Демо-данные</span>;
  if (kind === 'reach') return <span className="inline-block rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-3 py-1 text-[11px] font-semibold text-white">🚀 Конкурсный отбор</span>;
  return <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${LEVEL_STYLE[kind]}`}>{children ?? LEVEL_TEXT[kind]}</span>;
}

export function PathIndicator({ step, total = 7, label }: { step: number; total?: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-xs font-medium text-faint">Шаг {step} из {total} · {label}</p>
      <div className="flex w-full gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-gradient-to-r from-violet-500 to-blue-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

export function TaskCard({ title, deadline, done, onToggle, source }: {
  title: string; deadline: string | null; done: boolean; onToggle: () => void; source: string;
}) {
  return (
    <div className={`glass rounded-2xl p-4 transition-all ${done ? 'opacity-60' : 'hover:bg-white/[0.07]'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={done} onChange={onToggle} className="mt-1 size-5 shrink-0 cursor-pointer accent-violet-500" />
        <span>
          <span className={`text-[15px] font-medium ${done ? 'text-muted line-through' : 'text-foreground'}`}>{title}</span>
          <span className="mt-1 block text-xs text-faint">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="glass max-h-[85dvh] w-full max-w-lg overflow-auto rounded-t-3xl !bg-[#0c0c16]/95 p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть" className="glass flex size-9 items-center justify-center rounded-full text-muted hover:text-foreground">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="glass animate-pulse rounded-3xl p-5">
      <div className="h-4 w-2/3 rounded bg-white/10" />
      <div className="mt-3 h-4 w-1/2 rounded bg-white/5" />
    </div>
  );
}
