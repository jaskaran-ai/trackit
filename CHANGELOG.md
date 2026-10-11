# Changelog

## Unreleased

### Added

- Admin board move feedback. The column a card is dragged over gets an animated border beam, modeled on Arc's `file-dropzone` glow. A card that lands, by drag or the Move menu, flashes its border with an accent ring. Both are in `src/app/admin/KanbanBoard.module.css` and respect `prefers-reduced-motion`.
- Multiple assignees per submission. New `submissionAssignee` table with a unique `(submissionId, userId)` pair. Migration in `drizzle/0003_submission_assignees.sql`, not applied.
- `submissions.setAssignees` (admin only), exposed as `PUT /api/submissions/[id]/assignees` with body `{ userIds }`. `get` and the lean list return an `assignees` array.
- Detail page: assignee picker (saves on each change, reverts on failure).
- Kanban card: stacked assignee avatars beside the vote button, using Arc's `avatar-group` (installed to `src/components/arc/avatar-group/`).

### Changed

- Admin bulk-actions bar: controls share one row height and bottom-align, so the status and priority selects, Archive, Delete, and the "1 selected" pill line up. The selects are labelled "Status" and "Priority" with "Set status" and "Set priority" placeholders, and the empty option that Radix rejects is removed. Code: `src/components/admin/BulkActions.tsx`.
- Admin submissions table has an Assignees column showing the assignee avatars (Arc `AvatarGroup`, up to 3 then +N), or "Unassigned" when empty. Code: `src/app/admin/AdminTable.tsx`.
- Submission history loads 6 entries at a time and fetches the next page when the list scrolls into view. The API is keyset-paginated (`GET /api/submissions/[id]/history?limit=&cursor=`) and returns `{ items, nextCursor }`. Server pages seed only the first page. A Load more button under the timeline (Arc `Button`) fetches the next page as a fallback to scrolling. Code: `src/db/history.ts`, `src/orpc/routers/history.ts`, `src/hooks/use-status-history.ts`, `src/components/submission/StatusHistory.tsx`.
- Submission assignee picker rebuilt on Arc UI. Changes are drafted in a popover with avatars and saved with an explicit Save button, instead of saving on every click. Reset discards the draft. Uses Arc `Popover`, `Avatar`, `AvatarGroup`, and `Button` in `src/app/admin/submission/[id]/AdminAssigneePicker.tsx`.
- Drizzle schema split from monolithic `src/db/schema.ts` into domain modules under `src/db/schema/` (auth, submissions, comments, assignees, and related tables). Public imports stay `@/db/schema` and `./schema`; `drizzle.config.ts` points at `src/db/schema/index.ts`.
- Database scripts: `pnpm db:migrate` (auto-baselines when the DB was created with `db:push`, then applies pending SQL), `pnpm db:baseline`, `pnpm db:check`, `pnpm db:pull`. Applied migration `0003_submission_assignees` to the linked database.
- Admin board cards: the Move dropdown trigger is smaller (24px tall, extra-small text). Styled in `src/app/admin/KanbanBoard.module.css`.

### Reverted

- Admin Board view is back on the custom `KanbanBoard` (restored from git HEAD). The Arc Pro `kanban-board` block is no longer used, and its files were removed. The block's card couldn't render the type and priority badges, View link, and Move menu.
- Known issues in the restored board: the board copies `submissions` into local state once, so refetches don't update it. Vote counts on cards can start at 0 and stay stale until remount.
