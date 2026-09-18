"use client";

import { usePathname } from "next/navigation";
import { PathIndicator, type StepItem } from "@/components/ui";

const FLOW_STEPS: { path: string; label: string }[] = [
  { path: "/", label: "Вход" },
  { path: "/profile", label: "Анкета" },
  { path: "/recommendations", label: "Вузы" },
  { path: "/compare", label: "Сравнение" },
  { path: "/roadmap", label: "План" },
];

export function FlowLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const steps: StepItem[] = FLOW_STEPS.map((s) => ({
    label: s.label,
    done: isStepDone(pathname, s.path),
    active: pathname === s.path || (s.path !== "/" && pathname.startsWith(s.path)),
  }));

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col pb-16">
      <PathIndicator steps={steps} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function isStepDone(currentPath: string, stepPath: string): boolean {
  const order = FLOW_STEPS.map((s) => s.path);
  const currentIdx = order.indexOf(currentPath);
  const stepIdx = order.indexOf(stepPath);
  if (currentIdx === -1 || stepIdx === -1) return false;
  return stepIdx < currentIdx;
}
