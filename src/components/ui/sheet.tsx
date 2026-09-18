"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-0 w-full max-w-lg border-[3px] border-ink bg-paper p-0 shadow-brutal backdrop:bg-ink/40"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b-[3px] border-ink px-5 py-4">
          {title && (
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-8 w-8 border-2 border-ink bg-paper font-display text-sm font-bold hover:bg-mint-soft"
          >
            &times;
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
