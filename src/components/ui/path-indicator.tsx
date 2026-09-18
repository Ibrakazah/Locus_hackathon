"use client";

export interface StepItem {
  label: string;
  done: boolean;
  active: boolean;
}

export function PathIndicator({ steps }: { steps: StepItem[] }) {
  const currentIndex = steps.findIndex((s) => s.active);
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3 sm:px-6">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div
            className={`flex h-7 min-w-7 items-center justify-center border-2 border-ink px-1.5 font-display text-[11px] font-extrabold ${
              step.done
                ? "bg-mint text-ink"
                : step.active
                  ? "bg-sun text-ink"
                  : "bg-paper text-smoke"
            }`}
          >
            {step.done ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-xs font-bold sm:inline ${
              step.active ? "text-ink" : step.done ? "text-mint-deep" : "text-smoke"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`mx-0.5 h-[2px] w-3 sm:w-5 ${
                step.done ? "bg-mint" : "bg-ink/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
