"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/arc/multi-select/multi-select";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { useAdminUsers } from "@/hooks/use-admin-data";
import type { SubmissionAssignee } from "@/db/assignees";

/**
 * Assignees save on every change, like the Kanban move. The options come from
 * the admin user list, and the current assignees stand in until it loads.
 */
export default function AdminAssigneePicker({
  submissionId,
  assignees,
}: {
  submissionId: string;
  assignees: SubmissionAssignee[];
}) {
  const router = useRouter();
  const { toast } = useToastStack();
  const { data: users } = useAdminUsers();
  const [selected, setSelected] = useState(assignees.map((a) => a.id));
  const [saving, setSaving] = useState(false);

  const people = users ?? assignees;
  const options = people.map((person) => ({
    value: person.id,
    label: person.name,
  }));

  async function handleChange(next: string[]) {
    const previous = selected;
    setSelected(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: next }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      router.refresh();
    } catch {
      setSelected(previous);
      toast({ type: "error", title: "Could not update assignees" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <MultiSelect
      label="Assignees"
      options={options}
      value={selected}
      onValueChange={handleChange}
      placeholder="Unassigned"
      disabled={saving}
    />
  );
}
