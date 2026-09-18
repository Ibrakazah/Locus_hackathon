"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, Input, Select, Progress } from "@/components/ui";

type Route = "kz" | "abroad" | "undecided";
type Grade = "9" | "10" | "11" | "graduate";
type Funding = "grant_only" | "grant_or_contract" | "contract_ok";
type ExamKind = "ent" | "ielts" | "toefl" | "sat" | "act" | "nuet";
type EntStatus = "taken" | "trial" | "not_taken";

interface ProfileState {
  route: Route;
  grade: Grade;
  fields: string[];
  funding: Funding;
  exams: Partial<Record<ExamKind, { status: EntStatus; score?: number }>>;
  interestedInNu: boolean;
  gpa?: number;
}

const FIELDS_OPTIONS = [
  { value: "medicine", label: "Медицина" },
  { value: "it", label: "IT-инженерия" },
  { value: "business", label: "Бизнес-экономика" },
  { value: "law", label: "Право" },
  { value: "humanities", label: "Гуманитарные" },
  { value: "science", label: "Естественные" },
  { value: "creative", label: "Творческие" },
  { value: "undecided", label: "Не знаю" },
];

const STEPS = ["Маршрут", "Класс", "Направление", "Финансирование", "Экзамены"];

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileState>({
    route: "kz",
    grade: "11",
    fields: [],
    funding: "grant_or_contract",
    exams: {},
    interestedInNu: false,
  });

  const update = (patch: Partial<ProfileState>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  const toggleField = (field: string) => {
    const fields = profile.fields.includes(field)
      ? profile.fields.filter((f) => f !== field)
      : [...profile.fields, field].slice(0, 3);
    update({ fields });
  };

  const toggleExam = (exam: ExamKind) => {
    const exams = { ...profile.exams };
    if (exams[exam]) {
      delete exams[exam];
    } else {
      exams[exam] = { status: "not_taken" };
    }
    update({ exams });
  };

  const setExamStatus = (exam: ExamKind, status: EntStatus) => {
    const exams = { ...profile.exams };
    if (exams[exam]) {
      exams[exam] = { ...exams[exam], status };
    }
    update({ exams });
  };

  const setExamScore = (exam: ExamKind, score: number) => {
    const exams = { ...profile.exams };
    if (exams[exam]) {
      exams[exam] = { ...exams[exam], score };
    }
    update({ exams });
  };

  const handleSubmit = () => {
    sessionStorage.setItem("locus:profile", JSON.stringify(profile));
    router.push("/recommendations");
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return true;
      case 2:
        return profile.fields.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
            {STEPS[step]}
          </h1>
        </div>
        <span className="border-2 border-ink bg-mint px-2 py-0.5 font-display text-xs font-extrabold shadow-brutal-xs">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      <Progress value={(step + 1) / STEPS.length} />

      <Card>
        <div className="flex flex-col gap-5">
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-smoke">Где хочешь учиться?</p>
              <div className="flex flex-wrap gap-2">
                {(["kz", "abroad", "undecided"] as Route[]).map((r) => (
                  <Chip
                    key={r}
                    variant={profile.route === r ? "selected" : "default"}
                    onClick={() => update({ route: r })}
                  >
                    {r === "kz" ? "Казахстан" : r === "abroad" ? "Зарубеж" : "Пока не знаю"}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-smoke">В каком ты классе?</p>
              <div className="flex flex-wrap gap-2">
                {(["9", "10", "11", "graduate"] as Grade[]).map((g) => (
                  <Chip
                    key={g}
                    variant={profile.grade === g ? "selected" : "default"}
                    onClick={() => update({ grade: g })}
                  >
                    {g === "graduate" ? "Выпускник" : `${g} класс`}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-smoke">
                Какие направления интересны? (до 3)
              </p>
              <div className="flex flex-wrap gap-2">
                {FIELDS_OPTIONS.map((f) => (
                  <Chip
                    key={f.value}
                    variant={profile.fields.includes(f.value) ? "selected" : "default"}
                    onClick={() => toggleField(f.value)}
                  >
                    {f.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-smoke">Как оплатишь учёбу?</p>
              <div className="flex flex-col gap-2">
                {([
                  { value: "grant_only", label: "Только грант" },
                  { value: "grant_or_contract", label: "Грант или контракт" },
                  { value: "contract_ok", label: "Только контракт" },
                ] as { value: Funding; label: string }[]).map((o) => (
                  <Chip
                    key={o.value}
                    variant={profile.funding === o.value ? "selected" : "default"}
                    onClick={() => update({ funding: o.value })}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-smoke">
                Какие экзамены сдал/сдаёшь?
              </p>
              <div className="flex flex-wrap gap-2">
                {(["ent", "ielts", "toefl", "sat", "act", "nuet"] as ExamKind[]).map((e) => (
                  <Chip
                    key={e}
                    variant={profile.exams[e] ? "selected" : "default"}
                    onClick={() => toggleExam(e)}
                  >
                    {e.toUpperCase()}
                  </Chip>
                ))}
              </div>

              {profile.exams.ent && (
                <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-4">
                  <p className="text-xs font-bold uppercase text-smoke">ЕНТ</p>
                  <div className="flex gap-2">
                    {(["taken", "trial", "not_taken"] as EntStatus[]).map((s) => (
                      <Chip
                        key={s}
                        variant={profile.exams.ent?.status === s ? "selected" : "default"}
                        onClick={() => setExamStatus("ent", s)}
                      >
                        {s === "taken" ? "Сдал" : s === "trial" ? "Пробный" : "Не сдавал"}
                      </Chip>
                    ))}
                  </div>
                  {profile.exams.ent.status !== "not_taken" && (
                    <Input
                      type="number"
                      label="Балл ЕНТ"
                      min={0}
                      max={140}
                      value={String(profile.exams.ent.score ?? "")}
                      onChange={(e) => setExamScore("ent", Number(e.target.value) || 0)}
                    />
                  )}
                </div>
              )}

              {(profile.exams.ielts || profile.exams.toefl) && (
                <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-4">
                  <p className="text-xs font-bold uppercase text-smoke">IELTS / TOEFL</p>
                  <div className="flex gap-2">
                    {(["taken", "trial", "not_taken"] as EntStatus[]).map((s) => (
                      <Chip
                        key={s}
                        variant={
                          (profile.exams.ielts?.status ?? profile.exams.toefl?.status) === s
                            ? "selected"
                            : "default"
                        }
                        onClick={() => {
                          if (profile.exams.ielts) setExamStatus("ielts", s);
                          if (profile.exams.toefl) setExamStatus("toefl", s);
                        }}
                      >
                        {s === "taken" ? "Сдал" : s === "trial" ? "Пробный" : "Не сдавал"}
                      </Chip>
                    ))}
                  </div>
                  {(profile.exams.ielts?.status !== "not_taken" ||
                    profile.exams.toefl?.status !== "not_taken") && (
                    <Input
                      type="number"
                      label="Overall балл"
                      min={0}
                      max={9}
                      step={0.5}
                      value={String(
                        profile.exams.ielts?.score ?? profile.exams.toefl?.score ?? ""
                      )}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        if (profile.exams.ielts) setExamScore("ielts", val);
                        if (profile.exams.toefl) setExamScore("toefl", val);
                      }}
                    />
                  )}
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 border-2 border-ink bg-paper px-4 py-3 text-sm font-bold has-checked:bg-mint-soft">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-ink"
                  checked={profile.interestedInNu}
                  onChange={(e) => update({ interestedInNu: e.target.checked })}
                />
                Интересует NU
              </label>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3 border-t-2 border-ink/10 pt-5">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ← Назад
            </Button>
            {step === STEPS.length - 1 ? (
              <Button onClick={handleSubmit}>Показать результаты</Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Далее →
              </Button>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}
