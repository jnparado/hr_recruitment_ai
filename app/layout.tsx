import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Process — AI Recruitment Suite",
  description:
    "AI resume screening and screening interviews powered by Grok. Rank candidates, detect skill gaps, and automate first-round interviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                H
              </span>
              HR Process
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link
                href="/pipeline"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Pipeline
              </Link>
              <Link
                href="/screening"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Screening
              </Link>
              <Link
                href="/interview"
                className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Interview
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          HR Process — powered by Grok (xAI). AI output is advisory; final hiring decisions belong to humans.
        </footer>
      </body>
    </html>
  );
}
