'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Input, Magnet, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import type { Country, Field, Funding, Grade, Route } from '@/lib/types';

// Условия показа — обычные функции-предикаты, не парсер строк.
const showKzExams = (route: Route) => route !== 'abroad';
const showAbroad = (route: Route) => route === 'abroad';

const FIELDS: { k: Field; label: string }[] = [
  { k: 'medicine', label: 'Медицина' }, { k: 'it', label: 'IT' },
  { k: 'business', label: 'Бизнес' }, { k: 'law', label: 'Право' },
  { k: 'humanities', label: 'Гуманитарные' }, { k: 'science', label: 'Наука' },
  { k: 'creative', label: 'Творческие' }, { k: 'undecided', label: 'Пока не знаю' },
];
const COUNTRIES: { k: Country; label: string }[] = [
  { k: 'US', label: 'США' }, { k: 'UK', label: 'UK' }, { k: 'TR', label: 'Турция' },
];

export default function ProfilePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState<string[]>(['ent']);
  const [entScore, setEntScore] = useState('96');
  const [ieltsScore, setIeltsScore] = useState('6.5');
  const [satScore, setSatScore] = useState('1210');
  if (!hydrated) return <p className="text-center text-sm text-muted">Загрузка…</p>;

  const toggleField = (f: Field) => {
    const cur = profile.fields;
    const next = cur.includes(f) ? cur.filter((x) => x !== f) : [...cur.filter((x) => x !== 'undecided'), f].slice(0, 3);
    setProfile({ fields: (next.length ? next : ['undecided']) as Field[] });
  };
  const toggleExam = (e: string) => setExams((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  const toggleCountry = (c: Country) => {
    const cur = profile.abroadCountries ?? [];
    setProfile({ abroadCountries: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  };

  const finish = () => {
    const patch: Partial<typeof profile> = {};
    if (showKzExams(profile.route)) {
      if (exams.includes('ent')) patch.ent = { status: 'taken', score: Number(entScore) || null, profile: 'math-info' };
      else patch.ent = { status: 'not_taken', score: null, profile: null };
      if (exams.includes('ielts')) patch.ielts = { status: 'taken', score: Number(ieltsScore) || null };
      if (exams.includes('sat')) patch.sat = { status: 'taken', score: Number(satScore) || null };
      if (exams.includes('none')) {
        patch.ent = { status: 'not_taken', score: null, profile: null };
        patch.ielts = { status: 'not_taken', score: null };
        patch.sat = { status: 'not_taken', score: null };
      }
    }
    setProfile(patch);
    router.push('/diagnosis');
  };

  const steps = ['Маршрут', 'Класс', 'Направление', 'Финансирование', showAbroad(profile.route) ? 'Страны' : 'Экзамены'];
  const titles = ['Где учиться?', 'В каком классе?', 'Что интересно? (до 3)', 'Как оплачивать учёбу?', showAbroad(profile.route) ? 'Какие страны?' : 'Какие экзамены сдаёшь?'];

  return (
    <main className="flex flex-col gap-8">
      <PathIndicator step={2} label={`Анкета · ${steps[step]}`} />

      <Card className="rise">
        <h2 className="text-center font-serif text-4xl tracking-tight">{titles[step]}</h2>

        <div className="mt-6 flex flex-col gap-3">
          {step === 0 && (
            <div className="flex flex-col gap-2">
              {([['kz', 'Казахстан'], ['abroad', 'Зарубеж'], ['undecided', 'Пока не знаю — начнём с КЗ']] as [Route, string][]).map(([v, l]) => (
                <Magnet key={v}>
                  <Chip active={profile.route === v} onClick={() => setProfile({ route: v })} full>{l}</Chip>
                </Magnet>
              ))}
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {([[9, '9 класс'], [10, '10 класс'], [11, '11 класс'], ['graduate', 'Выпускник']] as [Grade, string][]).map(([v, l]) => (
                  <Magnet key={String(v)}>
                    <Chip active={profile.grade === v} onClick={() => setProfile({ grade: v })} full>{l}</Chip>
                  </Magnet>
                ))}
              </div>
              {profile.grade === 11 && <p className="text-center text-xs text-faint">11 класс, сен–апр: режим подготовки. Конкурс гранта скрыт до мая 2027.</p>}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {FIELDS.map((f) => <Magnet key={f.k} pull={6} scale={1.06}><Chip active={profile.fields.includes(f.k)} onClick={() => toggleField(f.k)}>{f.label}</Chip></Magnet>)}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-2">
              {([['grant_only', 'Только грант'], ['grant_or_contract', 'Грант или контракт'], ['contract_ok', 'Только контракт']] as [Funding, string][]).map(([v, l]) => (
                <Magnet key={v}>
                  <Chip active={profile.funding === v} onClick={() => setProfile({ funding: v })} full>{l}</Chip>
                </Magnet>
              ))}
            </div>
          )}
          {step === 4 && showAbroad(profile.route) && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => <Magnet key={c.k} pull={6} scale={1.06}><Chip active={(profile.abroadCountries ?? []).includes(c.k)} onClick={() => toggleCountry(c.k)}>{c.label}</Chip></Magnet>)}
              </div>
              <Input label="Бюджет $/год (A6)" type="number" value={profile.budgetUsd ?? ''} onChange={(e) => setProfile({ budgetUsd: e.target.value ? Number(e.target.value) : null })} hint="Фильтр стран и программ" />
            </div>
          )}
          {step === 4 && showKzExams(profile.route) && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {[['ent', 'ЕНТ'], ['ielts', 'IELTS'], ['sat', 'SAT'], ['nuet', 'NUET'], ['nis', 'НИШ'], ['none', 'Пока никаких']].map(([v, l]) => (
                  <Magnet key={v} pull={6} scale={1.06}>
                    <Chip active={exams.includes(v)} onClick={() => toggleExam(v)}>{l}</Chip>
                  </Magnet>
                ))}
              </div>
              {exams.includes('ent') && <Input label="E2 · ЕНТ балл" type="number" value={entScore} onChange={(e) => setEntScore(e.target.value)} />}
              {exams.includes('ielts') && <Input label="E3 · IELTS overall" type="number" value={ieltsScore} onChange={(e) => setIeltsScore(e.target.value)} />}
              {exams.includes('sat') && <Input label="E4 · SAT" type="number" value={satScore} onChange={(e) => setSatScore(e.target.value)} />}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bone p-4">
                <span className="text-sm font-semibold">Интересует NU?</span>
                <Chip active={!!profile.interestedInNu} onClick={() => setProfile({ interestedInNu: !profile.interestedInNu })}>{profile.interestedInNu ? 'Да' : 'Нет'}</Chip>
              </div>
              {profile.interestedInNu && <Input label="K11 · GPA аттестата (из 5.0)" type="number" value={profile.gpa ?? ''} onChange={(e) => setProfile({ gpa: e.target.value ? Number(e.target.value) : null })} />}
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-2">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>← Назад</Button>}
        {step < 4 ? <Button full onClick={() => setStep(step + 1)}>Далее →</Button> : <Button full onClick={finish}>К диагностике</Button>}
      </div>
      <button className="text-center text-xs text-faint" onClick={() => (step < 4 ? setStep(step + 1) : finish())}>Пропустить →</button>
    </main>
  );
}