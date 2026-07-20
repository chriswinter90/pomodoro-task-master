# Brief: Review stores module — fix bugs, simplify, add JSDoc
Status: SCOPED
Created: 2026-07-20
Base: 1e97a5f1d3e0a092ff3afddfe4e4e81729015415

## Goal
Fix 7 findings from the code review of `src/stores`: 4 correctness bugs, 1 simplification opportunity (duplicated localStorage helpers), and 2 nits. Add JSDoc documentation to all exported types and store actions. Improve consistency between the two stores.

## Findings

### F1: `setCompletedAt` never updates `task.completed` [bug]
- File: src/stores/tasks.ts:81
- Evidence: `value ? task.completedAt = new Date() : task.completedAt = null` — only sets `completedAt`, never flips `task.completed`
- Why: Task can end up with `completed: false, completedAt: <date>` — UI rendering `task.completed` is out of sync
- Fix: Also set `task.completed = value`

### F2: `getTimersFromLocalStorage` has no try/catch [bug]
- File: src/stores/timers.ts:13
- Evidence: `JSON.parse(lsTimers)` not wrapped in try/catch
- Why: Corrupt localStorage crashes app at module evaluation time. Tasks store has try/catch, timers doesn't — inconsistency
- Fix: Wrap in try/catch, fall back to `[defaultTimer]`

### F3: `setSelectedTimer` uses `!` on `find()` result [bug]
- File: src/stores/timers.ts:43
- Evidence: `this.selectedTimer = this.timers.find(timer => timer.id === id)!`
- Why: If timer not found, `selectedTimer` becomes `undefined`, crashing components that access `.duration`
- Fix: Guard with existence check, throw or fall back

### F4: `removeTimer` doesn't update `selectedTimer` [bug]
- File: src/stores/timers.ts:39
- Evidence: `removeTimer` filters timers but doesn't check if removed timer was selected
- Why: `selectedTimer` holds stale reference to detached object
- Fix: After filtering, if `selectedTimer.id === id`, reassign to `this.timers[0] ?? null`

### F5: Duplicated localStorage helpers [should-fix]
- File: src/stores/tasks.ts:31, src/stores/timers.ts:11
- Evidence: Both stores define `get*FromLocalStorage` and `save*ToLocalStorage` with near-identical structure; already drifted (tasks has try/catch, timers doesn't)
- Fix: Extract shared `loadFromLocalStorage(key, defaultFactory, reviver?)` and `saveToLocalStorage(key, data)` to `src/stores/persist.ts`

### F6: `editTask` silently no-ops when task not found [nit]
- File: src/stores/tasks.ts:60
- Evidence: `if (taskIndex !== -1) { ... }` — no else branch, no return value
- Fix: Return boolean indicating success, or throw

### F7: Variable shadowing in callbacks [nit]
- File: src/stores/tasks.ts:60,79
- Evidence: `findIndex(task => task.id === id)` shadows outer `task` parameter in `editTask(id, task)`
- Fix: Rename callback param to `t` or `existingTask`

## Key Files
- src/stores/tasks.ts — Pinia task store, has F1, F5, F6, F7
- src/stores/timers.ts — Pinia timer store, has F2, F3, F4, F5
- src/stores/index.ts — Pinia instance creation (no changes needed)

## Interview
- User chose to include all 7 findings in the brief (no inline fixes, no rejections).
- Focus: simplification, clean flow, JSDoc comments.

## Approach
1. Fix F1: Add `task.completed = value` in `setCompletedAt`
2. Fix F2: Wrap `JSON.parse` in try/catch in `getTimersFromLocalStorage`
3. Fix F3: Guard `setSelectedTimer` with existence check
4. Fix F4: Update `selectedTimer` in `removeTimer` when removed timer was selected
5. Fix F5: Extract shared localStorage helpers to `src/stores/persist.ts`
6. Fix F6: Return boolean from `editTask`
7. Fix F7: Rename callback parameters to avoid shadowing
8. Add JSDoc to all exported types (`Task`, `CreateTaskPayload`, `TimerData`) and all store actions

## Rejected Alternatives
- None — all findings accepted.

## Open Questions
- Should `setSelectedTimer` throw or fall back to a default timer when the ID is not found?
- Should `editTask` return a boolean or throw on not-found?

## Out of Scope
- Components, composables, router, plugins, layouts, pages
- Adding tests (could be a separate review cycle)

## Constraints
- Options-style Pinia stores (`defineStore` with `state`/`actions` objects)
- UUID v7 for ID generation
- Synchronous localStorage persistence after every mutation
- No new dependencies

## Verification
- `pnpm type-check` — TypeScript compiles without errors
- `pnpm lint` — ESLint passes
- Manual: app loads, tasks can be added/edited/completed, timers can be added/removed/selected
- Manual: corrupting localStorage entries doesn't crash the app
