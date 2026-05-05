"use client";

import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bug, Sparkles, Shield } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Grid background */}
        <div
          className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-40"
          aria-hidden="true"
        />
        {/* Gradient orb */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Bug size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-700 text-white">TrackIt</span>
          </div>

          <h1 className="font-display text-4xl font-800 text-white leading-tight mb-6">
            Ship better software,<br />
            <span className="text-indigo-400">together.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
            Track bugs and feature requests in one place. Keep your team aligned from first report to final fix.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Bug, label: "Bug Reports", desc: "Capture, triage, and resolve issues fast" },
            { icon: Sparkles, label: "Feature Requests", desc: "Collect and prioritize product ideas" },
            { icon: Shield, label: "Admin Control", desc: "Full oversight with status management" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-indigo-400" />
              </div>
              <div>
                <div className="text-sm font-500 text-zinc-200">{label}</div>
                <div className="text-xs text-zinc-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Bug size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-700 text-white">TrackIt</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-700 text-white mb-2">Welcome back</h2>
            <p className="text-zinc-400 text-sm">Sign in to continue to TrackIt</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 font-500 text-sm px-5 py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          <p className="text-center text-xs text-zinc-600 mt-6">
            By signing in, you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
