"use client";

import { Switch } from "@/components/arc/switch/switch";
import SectionHeading from "./SectionHeading";

export default function NotificationsSection({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <SectionHeading title="Notifications">
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="font-500 text-foreground">In-app notifications</p>
          <p className="mt-0.5 text-sm text-muted">
            Get a bell alert when someone comments on or updates a submission.
          </p>
        </div>

        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label="In-app notifications"
        />
      </div>
    </SectionHeading>
  );
}
