import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin', 'cyrillic'], weight: ['500', '700', '800', '900'] });

export const metadata: Metadata = {
  title: 'Локус·Маршрут — поступление',
  description: 'Персональный маршрут поступления: куда, почему подходит, что делать следующим шагом.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <header className="fixed inset-x-0 top-0 z-40 border-b-[3px] border-ink bg-cream">
          <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-2">
            <Link href="/" className="font-display text-sm font-black uppercase">Локус·Маршрут</Link>
            <div className="flex gap-3 font-display text-[11px] font-bold uppercase">
              <Link href="/profile">Анкета</Link>
              <Link href="/recommendations">Вузы</Link>
              <Link href="/roadmap">План</Link>
            </div>
          </nav>
        </header>
        <div className="flex flex-1 flex-col pt-[52px]">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6">{children}</div>
        </div>
        <footer className="border-t-[3px] border-ink bg-cream">
          <div className="mx-auto w-full max-w-2xl px-4 py-3 font-display text-[11px] font-bold uppercase text-smoke">
            LOCUS Hackathon 2026 · Кейс 2 · Анкета → Диагностика → Вузы → План
          </div>
        </footer>
      </body>
    </html>
  );
}
