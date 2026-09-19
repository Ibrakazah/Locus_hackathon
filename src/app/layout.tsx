import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'cyrillic'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Бағыт — поступление',
  description: 'Персональный маршрут поступления: куда, почему подходит, что делать следующим шагом.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="ai-bg flex min-h-full flex-col font-sans text-foreground">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
          Перейти к содержимому
        </a>
        <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-[#06060c]/70 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="bg-gradient-to-r from-violet-300 to-blue-400 bg-clip-text text-[15px] font-extrabold tracking-tight text-transparent">
              Бағыт
            </Link>
            <div className="flex gap-5 text-[13px] font-medium text-muted">
              <Link href="/profile" className="transition-colors hover:text-foreground">Анкета</Link>
              <Link href="/recommendations" className="transition-colors hover:text-foreground">Вузы</Link>
              <Link href="/roadmap" className="transition-colors hover:text-foreground">План</Link>
            </div>
          </nav>
        </header>
        <div id="content" className="flex flex-1 flex-col pt-16">
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">{children}</div>
        </div>
        <footer className="border-t border-line">
          <div className="mx-auto w-full max-w-2xl px-4 py-5 text-center text-xs text-faint">
            Бағыт — LOCUS Hackathon 2026 · Кейс 2
          </div>
        </footer>
      </body>
    </html>
  );
}
