import type { Metadata } from "next";
import "./globals.css";
import { PreferencesProvider } from "@/lib/preferences-context";
import { AnalyticsProvider } from "@/lib/analytics-context";
import { Toaster } from 'sonner';
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

export const metadata: Metadata = {
  title: "Video Watchlist",
  description: "Personal video watchlist for YouTube, Netflix, Nebula, and Twitch",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased"
      >
        <PreferencesProvider>
          <div className="min-h-screen bg-white dark:bg-black">
            {children}
          </div>
            <Toaster
              position="top-center"
              duration={5000}
              closeButton={true}
              richColors={true}
            />
        </PreferencesProvider>
      </body>
    </html>
  );
}
