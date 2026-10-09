import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

/** Original mark by default; black silhouette in light mode only. */
export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local brand asset, wide PNG
    <img
      src="/brand/ondemand-id-logo.png"
      alt="OnDemand ID"
      width={648}
      height={159}
      className={cn("h-8 w-auto light:brightness-0", className)}
    />
  );
}
