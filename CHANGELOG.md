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

### Changed

- `/auth/signin` and `/submit` pages are server components again. The hero, copy, and layout render on the server (`src/app/auth/signin/page.tsx`, `src/app/submit/page.tsx`). The interactive parts move to colocated client components: `GoogleSignInButton.tsx` (sign-in state and the Google button) and `SubmitForm.tsx` (form state, duplicate check, upload, and submit). Both routes stay prerendered (static).

### Fixed

- Lint runs again. `typescript` is pinned to `~6.0.3` and `eslint` to `~9.39.5`. typescript-eslint and eslint-plugin-react do not support TypeScript 7 or ESLint 10 yet, and the lint crashed on both.
- Lint errors cleared (16 to 0). Store reads from `localStorage` and `matchMedia` go through `useSyncExternalStore` (new `src/lib/local-storage-store.ts`), which replaces the mount-effect `setState` calls in the theme provider, dashboard list view, and submission search. Clock reads use `src/hooks/use-clock.ts`. The submit page clears its duplicate hints in the title change handler. The admin table resets its page during render when filters change. Notification icons are elements, not components picked during render.
- Admin page (`src/app/admin/page.tsx`) renders its shell without awaiting stats, submissions, users, or votes on the server. Each section loads through the shared query cache, so navigating from the dashboard no longer waits on the whole admin payload.
- `window.location.href` for the CSV export and sign-out now carries an eslint-disable with the reason (download, and a hard reload that clears the client cache).
- Remaining lint warnings cleared (6 to 0). Avatars on the admin detail, submission, settings, and archived views, plus the attachment thumbnail, use `next/image` with fixed sizes. Attachment thumbnails are `unoptimized` because they are served from uploadthing. The attachment lightbox keeps `<img>` on purpose, with an eslint-disable and the reason, because its intrinsic size is unknown.
- Unused imports and variables removed. `@typescript-eslint/no-unused-vars` ignores rest siblings and `_`-prefixed names (`eslint.config.mjs`).

### Reverted

- Admin Board view is back on the custom `KanbanBoard` (restored from git HEAD). The Arc Pro `kanban-board` block is no longer used, and its files were removed. The block's card couldn't render the type and priority badges, View link, and Move menu.
- Known issues in the restored board: the board copies `submissions` into local state once, so refetches don't update it. Vote counts on cards can start at 0 and stay stale until remount.
