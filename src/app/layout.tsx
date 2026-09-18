import type { Metadata } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin', 'cyrillic-ext'], weight: ['400', '500', '600', '700'] });
const instrument = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] });

export const metadata: Metadata = {
  title: 'Локус·Маршрут — поступление',
  description: 'Персональный маршрут поступления: куда, почему подходит, что делать следующим шагом.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${jakarta.variable} ${instrument.variable} h-full antialiased`}>
      <body className="page-bg flex min-h-full flex-col font-sans text-ink">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
          Перейти к содержимому
        </a>
        <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bone" data-scroll-header>
          <nav className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="font-serif text-[22px] leading-none tracking-tight">
              Локус·Маршрут
            </Link>
            <div className="flex items-center gap-7 text-[13px] font-medium text-muted">
              <Link href="/profile" className="transition-colors hover:text-ink">Анкета</Link>
              <Link href="/recommendations" className="transition-colors hover:text-ink">Вузы</Link>
              <Link href="/roadmap" className="transition-colors hover:text-ink">План</Link>
            </div>
          </nav>
        </header>
        <div id="content" className="flex flex-1 flex-col pt-16">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-10 sm:px-8">{children}</div>
        </div>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-4xl px-5 py-8 text-center text-xs text-faint sm:px-8">
            Локус·Маршрут — LOCUS Hackathon 2026 · Кейс 2
          </div>
        </footer>
      </body>
    </html>
  );
}