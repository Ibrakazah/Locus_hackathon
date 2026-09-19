'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Chip, Input, PathIndicator } from '@/components/ui';
import { useAppStore, useHydrated } from '@/lib/store';
import type { Country, ExamStatus, Field, Funding, Grade, Route } from '@/lib/types';

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

const ENT_PROFILES: { k: string; label: string }[] = [
  { k: 'math-physics', label: 'Математика + Физика' },
  { k: 'math-info', label: 'Математика + Информатика' },
  { k: 'bio-chem', label: 'Биология + Химия' },
  { k: 'chem-physics', label: 'Химия + Физика' },
  { k: 'worldhistory-geography', label: 'Всемирная история + География' },
  { k: 'worldhistory-law', label: 'Всемирная история + Право' },
  { k: 'lang-worldhistory', label: 'Иностранный язык + История' },
  { k: 'kazlit', label: 'Казахский + Казахская лит.' },
];

export default function ProfilePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState<string[]>(['ent']);
  const [entStatus, setEntStatus] = useState<ExamStatus>('not_taken');
  const [entProfile, setEntProfile] = useState('math-info');
  const [entScore, setEntScore] = useState('');
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
      if (exams.includes('ent')) {
        patch.ent = {
          status: entStatus,
          score: entStatus === 'not_taken' ? null : (Number(entScore) || null),
          profile: entProfile || null,
        };
      } else {
        patch.ent = { status: 'not_taken', score: null, profile: null };
      }
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
  const titles = ['Где учиться? 🌍', 'В каком классе? 🎓', 'Что интересно? (до 3) 💡', 'Как оплачивать учёбу? 💳', showAbroad(profile.route) ? 'Какие страны? 🗺️' : 'Какие экзамены сдаёшь? 📝'];

  return (
    <main className="flex flex-col gap-6">
      <PathIndicator step={2} label={`Анкета · ${steps[step]}`} />

      <Card className="rise">
        <p className="text-center text-xs font-semibold text-violet-300">Вопрос {step + 1} из 5</p>
        <h2 className="mt-1 text-center text-2xl font-extrabold tracking-tight">{titles[step]}</h2>

        {step === 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {([['kz', '🇰🇿 Казахстан'], ['abroad', '🌍 Зарубеж'], ['undecided', '🤔 Пока не знаю (начнём с КЗ)']] as [Route, string][]).map(([v, l]) => (
              <Chip key={v} active={profile.route === v} onClick={() => setProfile({ route: v })}>{l}</Chip>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {([[9, '9 класс'], [10, '10 класс'], [11, '11 класс'], ['graduate', '🎓 Выпускник']] as [Grade, string][]).map(([v, l]) => (
                <Chip key={String(v)} active={profile.grade === v} onClick={() => setProfile({ grade: v })}>{l}</Chip>
              ))}
            </div>
            {profile.grade === 11 && <p className="text-center text-xs text-faint">11 класс, сен–апр: режим подготовки. Конкурс гранта скрыт до мая 2027.</p>}
          </div>
        )}
        {step === 2 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {FIELDS.map((f) => <Chip key={f.k} active={profile.fields.includes(f.k)} onClick={() => toggleField(f.k)}>{f.label}</Chip>)}
          </div>
        )}
        {step === 3 && (
          <div className="mt-5 flex flex-col gap-2">
            {([['grant_only', '🏆 Только грант'], ['grant_or_contract', '🔄 Грант или контракт'], ['contract_ok', '💳 Только контракт']] as [Funding, string][]).map(([v, l]) => (
              <Chip key={v} active={profile.funding === v} onClick={() => setProfile({ funding: v })}>{l}</Chip>
            ))}
          </div>
        )}
        {step === 4 && showAbroad(profile.route) && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {COUNTRIES.map((c) => <Chip key={c.k} active={(profile.abroadCountries ?? []).includes(c.k)} onClick={() => toggleCountry(c.k)}>{c.label}</Chip>)}
            </div>
            <Input label="Бюджет $/год (A6)" type="number" value={profile.budgetUsd ?? ''} onChange={(e) => setProfile({ budgetUsd: e.target.value ? Number(e.target.value) : null })} hint="Фильтр стран и программ" />
          </div>
        )}
        {step === 4 && showKzExams(profile.route) && (
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {[['ent', 'ЕНТ'], ['ielts', 'IELTS'], ['sat', 'SAT'], ['nuet', 'NUET'], ['nis', 'НИШ'], ['none', 'Пока никаких']].map(([v, l]) => (
                <Chip key={v} active={exams.includes(v)} onClick={() => toggleExam(v)}>{l}</Chip>
              ))}
            </div>
            {exams.includes('ent') && (
              <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Статус ЕНТ</p>
                <div className="flex flex-wrap gap-2">
                  {([['taken', 'Сдал'], ['trial', 'Пробный'], ['not_taken', 'Не сдавал']] as [ExamStatus, string][]).map(([v, l]) => (
                    <Chip key={v} active={entStatus === v} onClick={() => setEntStatus(v)}>{l}</Chip>
                  ))}
                </div>
                {entStatus !== 'not_taken' ? (
                  <Input label="ЕНТ балл (0–140)" type="number" value={entScore} onChange={(e) => setEntScore(e.target.value)} />
                ) : (
                  <p className="text-xs text-amber-300">Задача «записаться на ЕНТ» появится в плане автоматически.</p>
                )}
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Профильные предметы</p>
                <div className="flex flex-wrap gap-2">
                  {ENT_PROFILES.map((ep) => (
                    <Chip key={ep.k} active={entProfile === ep.k} onClick={() => setEntProfile(ep.k)}>{ep.label}</Chip>
                  ))}
                </div>
              </div>
            )}
            {exams.includes('ielts') && <Input label="IELTS overall" type="number" value={ieltsScore} onChange={(e) => setIeltsScore(e.target.value)} />}
            {exams.includes('sat') && <Input label="SAT балл" type="number" value={satScore} onChange={(e) => setSatScore(e.target.value)} />}
            <div className="glass flex items-center justify-between gap-3 rounded-2xl p-4">
              <span className="text-sm font-semibold">Интересует NU?</span>
              <div className="flex gap-2">
                <Chip active={!!profile.interestedInNu} onClick={() => setProfile({ interestedInNu: true })}>Да ✨</Chip>
                <Chip active={!profile.interestedInNu} onClick={() => setProfile({ interestedInNu: false })}>Нет</Chip>
              </div>
            </div>
            {profile.interestedInNu && <Input label="GPA аттестата (из 5.0)" type="number" value={profile.gpa ?? ''} onChange={(e) => setProfile({ gpa: e.target.value ? Number(e.target.value) : null })} />}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}>← Назад</Button>}
        {step < 4 ? <Button onClick={() => setStep(step + 1)}>Далее →</Button> : <Button onClick={finish}>К диагностике ✨</Button>}
      </div>
      <button className="text-center text-xs text-faint" onClick={() => (step < 4 ? setStep(step + 1) : finish())}>Пропустить →</button>
    </main>
  );
}
