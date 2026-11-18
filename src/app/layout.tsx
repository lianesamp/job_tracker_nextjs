import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "Job Tracker",
    template: "%s | Job Tracker",
  },
  description:
    "Track your developer job applications in Spain. Kanban board, status history and stats.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a href="/" className="text-lg font-semibold">
              Job Tracker
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/board" className="hover:underline">
                Board
              </a>
              <a href="/stats" className="hover:underline">
                Stats
              </a>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
