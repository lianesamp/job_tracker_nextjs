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

/**
 * Root metadata — applies to all pages unless overridden.
 *
 * OPENGRAPH TAGS:
 * These control what appears when someone shares a link on LinkedIn, Twitter,
 * Slack, etc. The social platform reads the og:title, og:description, og:type
 * from the HTML <meta> tags and uses them to render a preview card.
 *
 * The `title.template` also applies to OpenGraph titles, so child pages
 * automatically get "Page Title | Job Tracker" in social previews too.
 *
 * Laravel equivalent: setting <meta property="og:..."> tags in your Blade
 * layout's <head> section. Next.js generates these from the metadata object.
 */
export const metadata: Metadata = {
  title: {
    default: "Job Tracker",
    template: "%s | Job Tracker",
  },
  description:
    "Track your developer job applications in Spain. Kanban board, status history and stats.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Job Tracker",
    title: {
      default: "Job Tracker",
      template: "%s | Job Tracker",
    },
    description:
      "Track your developer job applications in Spain. Kanban board, status history and stats.",
  },
  twitter: {
    card: "summary",
    title: {
      default: "Job Tracker",
      template: "%s | Job Tracker",
    },
    description:
      "Track your developer job applications in Spain. Kanban board, status history and stats.",
  },
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
