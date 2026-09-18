import type { WizardState, WizardAction } from "@/lib/flow/wizard";

export interface StepProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  totals: { ent: number };
}