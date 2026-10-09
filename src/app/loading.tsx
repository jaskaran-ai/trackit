import { Skeleton } from "@/components/arc/skeleton/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Skeleton lines={3} label="Loading" />
      </div>
    </div>
  );
}
