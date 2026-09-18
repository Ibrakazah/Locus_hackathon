'use client';
import React from 'react';
import type { MatchLevel } from '@/lib/types';

export function Button({ children, onClick, variant, className = '', type, full = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost'; className?: string; type?: 'button' | 'submit'; full?: boolean;
}) {
  const base = `inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${full ? 'w-full' : ''}`;
  const color = variant === 'ghost'
    ? 'border border-line bg-transparent text-ink hover:border-ink'
    : 'bg-ink text-white hover:bg-deep';
  return <button type={type ?? 'button'} onClick={onClick} className={`${base} ${color} ${className}`}>{children}</button>;
}

export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`rounded-xl border border-line bg-paper p-6 ${className}`}>{children}</div>;
}

export function Chip({ children, active, onClick, className = '', full = false }: { children: React.ReactNode; active?: boolean; onClick?: () => void; className?: string; full?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] rounded-md px-4 py-2 text-sm transition-all duration-200 active:scale-[0.97] ${full ? 'w-full text-left' : ''} ${active ? 'border border-ink bg-ink text-white' : 'border border-line bg-paper text-ink hover:border-ink'} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <input
        {...props}
        className="min-h-[44px] rounded-md border border-line bg-paper px-4 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-faint focus:border-ink"
      />
      {hint ? <span className="text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

const LEVEL_STYLE: Record<MatchLevel, string> = {
  fits: 'bg-acc-green-bg text-acc-green-fg',
  close: 'bg-acc-amber-bg text-acc-amber-fg',
  fails: 'bg-acc-rose-bg text-acc-rose-fg',
};
const LEVEL_TEXT: Record<MatchLevel, string> = {
  fits: 'Проходишь порог',
  close: 'Близко к порогу',
  fails: 'Не проходишь',
};

export function Badge({ kind, children }: { kind: 'source' | 'demo' | 'reach' | MatchLevel; children?: React.ReactNode }) {
  const base = 'inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]';
  if (kind === 'source') return <span className={`${base} bg-acc-blue-bg text-acc-blue-fg`}>Источник</span>;
  if (kind === 'demo') return <span className={`${base} bg-acc-amber-bg text-acc-amber-fg`}>Демо-данные</span>;
  if (kind === 'reach') return <span className={`${base} bg-bone text-ink`}>Конкурсный отбор</span>;
  return <span className={`${base} ${LEVEL_STYLE[kind]}`}>{children ?? LEVEL_TEXT[kind]}</span>;
}

export function PathIndicator({ step, total = 8, label }: { step: number; total?: number; label: string }) {
  const pct = (step / total) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
        <span className="font-mono text-[11px] text-faint">{step} / {total}</span>
      </div>
      <div className="h-px w-full bg-line">
        <div className="h-px bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TaskCard({ title, deadline, done, onToggle, source }: {
  title: string; deadline: string | null; done: boolean; onToggle: () => void; source: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-paper p-4 transition-colors ${done ? 'opacity-55' : 'hover:border-ink/30'}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={done} onChange={onToggle} className="mt-1 size-4 shrink-0 cursor-pointer" />
        <span>
          <span className={`text-[15px] ${done ? 'text-muted line-through' : 'text-ink'}`}>{title}</span>
          <span className="mt-1 block font-mono text-[11px] text-faint">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 backdrop-blur-sm p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[85dvh] w-full max-w-lg overflow-auto rounded-t-xl border border-line bg-paper p-6 shadow-[0_24px_64px_rgba(0,0,0,0.08)] sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть" className="flex size-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-ink hover:text-ink">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-line bg-paper p-6">
      <div className="h-4 w-2/3 rounded bg-line" />
      <div className="mt-3 h-4 w-1/2 rounded bg-line/60" />
    </div>
  );
}

// «Магнитная» строка выбора: тянется к курсору и увеличивается при наведении.
export function Magnet({ children, className = '', pull = 10, scale = 1.045 }: {
  children: React.ReactNode; className?: string; pull?: number; scale?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const px = Math.max(-pull, Math.min(pull, dx * 0.05));
        const py = Math.max(-pull, Math.min(pull, dy * 0.05));
        el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${scale})`;
      }}
      onMouseLeave={(e) => {
        const el = ref.current;
        if (el) el.style.transform = '';
      }}
      className={`will-change-transform transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
    >
      {children}
    </div>
  );
}