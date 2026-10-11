"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Avatar } from "@/components/arc/avatar/avatar";
import { AvatarGroup } from "@/components/arc/avatar-group/avatar-group";
import { Button } from "@/components/arc/button/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/arc/popover/popover";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";
import { useAdminUsers } from "@/hooks/use-admin-data";
import type { SubmissionAssignee } from "@/db/assignees";
import styles from "./AdminAssigneePicker.module.css";

/**
 * Edits happen in a draft inside the popover. Nothing is written until Save,
 * and closing the popover without saving discards the draft.
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
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(() => assignees.map((a) => a.id));
  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);

  const people = users ?? assignees;
  const savedPeople = people.filter((person) => saved.includes(person.id));
  const dirty = draft.length !== saved.length || draft.some((id) => !saved.includes(id));

  function handleOpenChange(next: boolean) {
    if (next) setDraft(saved);
    setOpen(next);
  }

  function toggle(id: string) {
    setDraft((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: draft }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      setSaved(draft);
      setOpen(false);
      toast({ type: "success", title: "Assignees saved" });
      router.refresh();
    } catch {
      toast({ type: "error", title: "Could not save assignees" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>Assignees</span>
      <div className={styles.row}>
        {savedPeople.length > 0 ? (
          <AvatarGroup
            size="sm"
            max={3}
            label="Assignees"
            members={savedPeople.map((person) => ({
              name: person.name,
              src: person.image ?? undefined,
            }))}
          />
        ) : (
          <span className={styles.empty}>Unassigned</span>
        )}

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm">
              {saved.length > 0 ? "Edit assignees" : "Assign people"}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="start" className={styles.panel}>
            <div role="group" aria-label="People" className={styles.list}>
              {people.map((person) => {
                const picked = draft.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    aria-pressed={picked}
                    className={styles.option}
                    onClick={() => toggle(person.id)}
                  >
                    <Avatar name={person.name} src={person.image ?? undefined} size="sm" />
                    <span className={styles.name}>{person.name}</span>
                    {picked && <Check size={16} aria-hidden="true" className={styles.check} />}
                  </button>
                );
              })}
            </div>

            <div className={styles.footer}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(saved)}
                disabled={!dirty || saving}
              >
                Reset
              </Button>
              <Button size="sm" onClick={save} disabled={!dirty} loading={saving}>
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
