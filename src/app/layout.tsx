import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackIt — Bug & Feature Tracker",
  description: "Track bugs and feature requests with ease",
};

/**
 * Picks the theme and accent before React hydrates so the first paint is
 * already right. Kept in sync with ThemeProvider's storage keys; the class
 * mirrors the `dark` the server renders, hence suppressHydrationWarning on
 * <html>. The accent attribute must match the ids in src/lib/accents.ts.
 */
const themeScript = `(function(){try{var r=document.documentElement;var t=localStorage.getItem("trackit-theme");r.classList.remove("light","dark");if(t==="light"||t==="dark"){r.classList.add(t);return;}r.classList.add(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");}catch(e){document.documentElement.classList.add("dark");}
try{var a=localStorage.getItem("trackit-accent");if(a&&["indigo","violet","blue","green","amber","orange","coral","rose","neutral"].indexOf(a)>-1){document.documentElement.setAttribute("data-accent",a);}else{document.documentElement.setAttribute("data-accent","indigo");}}catch(e){document.documentElement.setAttribute("data-accent","indigo");}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-accent="indigo" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-zinc-900)",
              color: "var(--color-zinc-100)",
              border: "1px solid var(--color-zinc-800)",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
