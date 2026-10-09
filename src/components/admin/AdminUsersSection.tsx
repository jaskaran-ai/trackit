"use client";

import UserManagement from "@/components/admin/UserManagement";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { useAdminUsers } from "@/hooks/use-admin-data";

/**
 * The user table. `currentUserId` arrives from the server, which already
 * resolved the session for the admin gate, so no extra auth call is made here.
 */
export default function AdminUsersSection({ currentUserId }: { currentUserId: string }) {
  const { data: users } = useAdminUsers();

  return (
    <Skeleton loading={!users} lines={4} label="Loading users">
      {users ? <UserManagement users={users} currentUserId={currentUserId} /> : null}
    </Skeleton>
  );
}
