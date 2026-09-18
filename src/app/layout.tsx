import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { SiteNav } from "@/components/ui";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Локус·Маршрут — поступление в вузы Казахстана",
  description:
    "Персональный маршрут поступления в вузы Казахстана: диагностика, подбор вузов, roadmap и следующий шаг.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-cream font-sans text-ink">
        <SiteNav />
        <div className="flex flex-1 flex-col pt-[60px]">{children}</div>
        <footer className="border-t-[3px] border-ink bg-cream">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 font-display text-xs font-bold uppercase tracking-wide text-smoke sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              Локус<span className="text-mint-deep">·</span>Маршрут — LOCUS Hackathon 2026
            </span>
            <span>Кейс 2 · Анкета → Диагностика → Вузы → Roadmap</span>
          </div>
        </footer>
      </body>
    </html>
  );
}