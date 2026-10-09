import { Skeleton } from "@/components/arc/skeleton/skeleton";

export default function SignInLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-xs">
        <Skeleton lines={2} label="Loading sign in" />
      </div>
    </div>
  );
}
