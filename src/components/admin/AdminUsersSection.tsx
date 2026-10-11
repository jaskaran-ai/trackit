"use client";

import UserManagement from "@/components/admin/UserManagement";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { useAdminUsers } from "@/hooks/use-admin-data";

/** The user table. The signed-in admin comes from the session hook, so the
 *  section needs nothing from the page. */
export default function AdminUsersSection() {
  const { data: users } = useAdminUsers();

  return (
    <Skeleton loading={!users} lines={4} label="Loading users">
      {users ? <UserManagement users={users} /> : null}
    </Skeleton>
  );
}
