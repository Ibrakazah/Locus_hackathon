'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Input, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import type { Country, Field, Funding, Grade, Route } from '@/lib/types';

// Условия показа — обычные функции-предикаты, не парсер строк.
const showKzExams = (route: Route) => route !== 'abroad';
const showAbroad = (route: Route) => route === 'abroad';

const FIELDS: { k: Field; label: string }[] = [
  { k: 'medicine', label: '🏥 Медицина' }, { k: 'it', label: '💻 IT' },
  { k: 'business', label: '📊 Бизнес' }, { k: 'law', label: '⚖️ Право' },
  { k: 'humanities', label: '📚 Гуманитарные' }, { k: 'science', label: '🔬 Наука' },
  { k: 'creative', label: '🎨 Творческие' }, { k: 'undecided', label: '❓ Не знаю' },
];
const COUNTRIES: { k: Country; label: string }[] = [
  { k: 'US', label: '🇺🇸 США' }, { k: 'UK', label: '🇬🇧 UK' }, { k: 'TR', label: '🇹🇷 Турция' },
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
  if (!hydrated) return <p>Загрузка…</p>;

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

  return (
    <main className="flex flex-col gap-4">
      <PathIndicator step={2} label={`Анкета · ${steps[step]}`} />
      <div className="flex gap-1">{steps.map((s, i) => (
        <div key={s} className={`h-1.5 flex-1 ${i <= step ? 'bg-mint' : 'bg-paper border border-ink'}`} />
      ))}</div>

      {step === 0 && (
        <Card><h2 className="font-display font-extrabold uppercase">C1 · Где учиться?</h2>
          <div className="mt-3 flex flex-col gap-2">
            {([['kz', '🇰🇿 Казахстан'], ['abroad', '🌍 Зарубеж'], ['undecided', '🤔 Пока не знаю (начнём с КЗ)']] as [Route, string][]).map(([v, l]) => (
              <Chip key={v} active={profile.route === v} onClick={() => setProfile({ route: v })}>{l}</Chip>
            ))}
          </div>
        </Card>
      )}
      {step === 1 && (
        <Card><h2 className="font-display font-extrabold uppercase">C2 · Класс?</h2>
          <div className="mt-3 flex flex-col gap-2">
            {([[9, '9 класс'], [10, '10 класс'], [11, '11 класс'], ['graduate', 'Выпускник']] as [Grade, string][]).map(([v, l]) => (
              <Chip key={String(v)} active={profile.grade === v} onClick={() => setProfile({ grade: v })}>{l}</Chip>
            ))}
          </div>
          {profile.grade === 11 && <p className="mt-2 text-xs text-smoke">11 класс, сен–апр: режим подготовки. Конкурс гранта скрыт до мая 2027.</p>}
        </Card>
      )}
      {step === 2 && (
        <Card><h2 className="font-display font-extrabold uppercase">C3 · Направления (до 3)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {FIELDS.map((f) => <Chip key={f.k} active={profile.fields.includes(f.k)} onClick={() => toggleField(f.k)}>{f.label}</Chip>)}
          </div>
        </Card>
      )}
      {step === 3 && (
        <Card><h2 className="font-display font-extrabold uppercase">C4 · Финансирование?</h2>
          <div className="mt-3 flex flex-col gap-2">
            {([['grant_only', '🏆 Только грант'], ['grant_or_contract', '🔄 Грант или контракт'], ['contract_ok', '💳 Только контракт']] as [Funding, string][]).map(([v, l]) => (
              <Chip key={v} active={profile.funding === v} onClick={() => setProfile({ funding: v })}>{l}</Chip>
            ))}
          </div>
        </Card>
      )}
      {step === 4 && showAbroad(profile.route) && (
        <Card><h2 className="font-display font-extrabold uppercase">A1 · Страны (обязательно)</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {COUNTRIES.map((c) => <Chip key={c.k} active={(profile.abroadCountries ?? []).includes(c.k)} onClick={() => toggleCountry(c.k)}>{c.label}</Chip>)}
          </div>
          <div className="mt-3"><Input label="Бюджет $/год (A6)" type="number" value={profile.budgetUsd ?? ''} onChange={(e) => setProfile({ budgetUsd: e.target.value ? Number(e.target.value) : null })} placeholder="5000" /></div>
        </Card>
      )}
      {step === 4 && showKzExams(profile.route) && (
        <Card><h2 className="font-display font-extrabold uppercase">E1 · Какие экзамены?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[['ent', 'ЕНТ'], ['ielts', 'IELTS'], ['sat', 'SAT'], ['nuet', 'NUET'], ['nis', 'НИШ'], ['none', 'Пока никаких']].map(([v, l]) => (
              <Chip key={v} active={exams.includes(v)} onClick={() => toggleExam(v)}>{l}</Chip>
            ))}
          </div>
          {exams.includes('ent') && <div className="mt-3"><Input label="E2 · ЕНТ балл" type="number" value={entScore} onChange={(e) => setEntScore(e.target.value)} /></div>}
          {exams.includes('ielts') && <div className="mt-3"><Input label="E3 · IELTS overall" type="number" value={ieltsScore} onChange={(e) => setIeltsScore(e.target.value)} /></div>}
          {exams.includes('sat') && <div className="mt-3"><Input label="E4 · SAT" type="number" value={satScore} onChange={(e) => setSatScore(e.target.value)} /></div>}
          <div className="mt-3 flex gap-2 items-center text-sm font-bold">
            <span>Интересует NU?</span>
            <Chip active={!!profile.interestedInNu} onClick={() => setProfile({ interestedInNu: !profile.interestedInNu })}>{profile.interestedInNu ? 'ДА' : 'НЕТ'}</Chip>
          </div>
          {profile.interestedInNu && <div className="mt-3"><Input label="K11 · GPA аттестата (из 5.0)" type="number" value={profile.gpa ?? ''} onChange={(e) => setProfile({ gpa: e.target.value ? Number(e.target.value) : null })} placeholder="4.7" /></div>}
        </Card>
      )}

      <div className="flex gap-2">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>← Назад</Button>}
        {step < 4 ? <Button onClick={() => setStep(step + 1)}>Далее →</Button> : <Button onClick={finish}>К диагностике →</Button>}
      </div>
      <button className="text-xs font-bold uppercase text-smoke" onClick={() => (step < 4 ? setStep(step + 1) : finish())}>Пропустить →</button>
    </main>
  );
}
