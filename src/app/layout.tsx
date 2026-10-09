import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import {
  ToastStack,
  ToastStackProvider,
} from "@/components/arc/toast-stack/toast-stack";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import QueryProvider from "@/components/QueryProvider";
import "@/components/arc/foundation.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackIt — Bug & Feature Tracker",
  description: "Track bugs and feature requests with ease",
};

/**
 * Arc reads `--font-geist` and `--font-inter` (see components/arc/foundation.css),
 * so the variable names have to match exactly or the stack falls back to system sans.
 */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Picks the theme and accent before React hydrates so the first paint is
 * already right. Kept in sync with ThemeProvider's storage keys.
 *
 * Two attributes are written for every theme: `data-theme` is what Arc's tokens
 * key off, and the `light` / `dark` class is what the Tailwind `light:` variant
 * and the zinc ramp in globals.css read. They must never disagree.
 */
const themeScript = `(function(){var r=document.documentElement;var t=null;try{t=localStorage.getItem("trackit-theme");}catch(e){}
if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
r.classList.remove("light","dark");r.classList.add(t);r.setAttribute("data-theme",t);
try{var a=localStorage.getItem("trackit-accent");if(a&&["neutral","violet","blue","green","amber","orange","coral","rose"].indexOf(a)>-1){r.setAttribute("data-accent",a);}else{r.setAttribute("data-accent","neutral");}}catch(e){r.setAttribute("data-accent","neutral");}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geist.variable} ${inter.variable}`}
      data-theme="dark"
      data-accent="neutral"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-body bg-background text-foreground antialiased min-h-screen">
        <QueryProvider>
          <ThemeProvider>
            {/*
              The provider owns the queue and the viewport renders it. Both sit
              above every route, so a result raised on one page survives the
              navigation that follows it.
            */}
            <ToastStackProvider>
              {children}
              <ToastStack position="bottom-right" label="Notifications" />
            </ToastStackProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
