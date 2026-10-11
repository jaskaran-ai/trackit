import { Bug, Shield, Sparkles } from "lucide-react";
import BrandLogo from "@/components/shared/BrandLogo";
import GoogleSignInButton from "@/app/auth/signin/GoogleSignInButton";

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

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface p-10 lg:flex">
        <div>
          <BrandLogo className="h-10 sm:h-12" />
          <p className="mt-2.5 text-sm text-muted">Bug and feature tracker</p>
        </div>

        <div>
          <h1 className="mb-5 font-display text-4xl font-500 leading-tight text-foreground">
            Ship better software,
            <br />
            <span className="text-accent">together.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-secondary">
            Track bugs and feature requests in one place. Keep your team aligned
            from first report to final fix.
          </p>
        </div>

        <div className="space-y-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5">
              <Icon size={15} aria-hidden className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="text-sm font-500 text-foreground">{label}</div>
                <div className="text-xs text-muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo className="h-9" />
          </div>

          <div className="mb-6">
            <h2 className="mb-2 font-display text-2xl font-500 text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-secondary">Sign in to continue to TrackIt</p>
          </div>

          <GoogleSignInButton />

          <p className="mt-5 text-center text-xs text-muted">
            TrackIt uses your Google account to sign you in.
          </p>
        </div>
      </div>
    </div>
  );
}
