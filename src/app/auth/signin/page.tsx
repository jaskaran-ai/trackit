"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";
import { Bug, Shield, Sparkles } from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";
import { Button } from "@/components/arc/button/button";

const FEATURES = [
  {
    icon: Bug,
    label: "Bug reports",
    desc: "Capture, triage, and resolve issues fast",
  },
  {
    icon: Sparkles,
    label: "Feature requests",
    desc: "Collect and prioritize product ideas",
  },
  {
    icon: Shield,
    label: "Admin control",
    desc: "Full oversight with status management",
  },
];

/* The Google mark, in Google's own four brand colours. It is the one place a
   literal hex is correct: recolouring a third party's logo breaks their brand
   guidelines, and it is not an Arc surface. */
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface p-12 lg:flex">
        <div>
          <BrandLogo className="h-10 sm:h-12" />
          <p className="mt-3 text-sm text-muted">Bug and feature tracker</p>
        </div>

        <div>
          <h1 className="mb-6 font-display text-4xl font-500 leading-tight text-foreground">
            Ship better software,
            <br />
            <span className="text-accent">together.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-secondary">
            Track bugs and feature requests in one place. Keep your team aligned
            from first report to final fix.
          </p>
        </div>

        <div className="space-y-4">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <Icon size={15} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="text-sm font-500 text-foreground">{label}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <BrandLogo className="h-9" />
          </div>

          <div className="mb-8">
            <h2 className="mb-2 font-display text-2xl font-500 text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-secondary">Sign in to continue to TrackIt</p>
          </div>

          {/*
            Google's sign-in button has to stay white with the official mark, so
            it opts out of Arc's button fill. Everything else, including the
            pending state, comes from the component.
          */}
          <Button
            className="w-full bg-white text-zinc-900 hover:bg-zinc-100 hover:opacity-100"
            onClick={handleGoogleSignIn}
            loading={loading}
            aria-label={loading ? "Signing in" : undefined}
          >
            {!loading && <GoogleMark />}
            {loading ? "Signing in" : "Continue with Google"}
          </Button>

          <p className="mt-6 text-center text-xs text-muted">
            TrackIt uses your Google account to sign you in.
          </p>
        </div>
      </div>
    </div>
  );
}