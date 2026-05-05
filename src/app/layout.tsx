import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackIt — Bug & Feature Tracker",
  description: "Track bugs and feature requests with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
