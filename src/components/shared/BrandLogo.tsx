import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export default function BrandLogo({ className }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local brand asset, wide PNG
    <img
      src="/brand/ondemand-id-logo-white.png"
      alt="OnDemand ID"
      width={828}
      height={407}
      className={cn("h-8 w-auto", className)}
    />
  );
}
