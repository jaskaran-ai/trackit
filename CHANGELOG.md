# Changelog

## Unreleased

### Added

- Admin board move feedback. The column a card is dragged over gets an animated border beam, modeled on Arc's `file-dropzone` glow. A card that lands, by drag or the Move menu, flashes its border with an accent ring. Both are in `src/app/admin/KanbanBoard.module.css` and respect `prefers-reduced-motion`.

### Changed

- Admin board cards: the Move dropdown trigger is smaller (24px tall, extra-small text). Styled in `src/app/admin/KanbanBoard.module.css`.

### Reverted

- Admin Board view is back on the custom `KanbanBoard` (restored from git HEAD). The Arc Pro `kanban-board` block is no longer used, and its files were removed. The block's card couldn't render the type and priority badges, View link, and Move menu.
- Known issues in the restored board: the board copies `submissions` into local state once, so refetches don't update it. Vote counts on cards can start at 0 and stay stale until remount.
