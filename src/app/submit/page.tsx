import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import SubmitForm from "@/app/submit/SubmitForm";

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4 flex items-baseline gap-3">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={12} aria-hidden />
            Back
          </Link>
          <h1 className="font-display text-lg font-500 text-foreground">
            New submission
          </h1>
          <p className="hidden text-xs text-muted sm:block">
            Report a bug or request a feature
          </p>
        </div>

        <SubmitForm />
      </main>
    </div>
  );
}
