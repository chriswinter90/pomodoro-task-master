## Findings

### F1: `setCompletedAt` never updates `task.completed` boolean — state can diverge [bug]
- File: src/stores/tasks.ts:68-73
- Evidence: `setCompletedAt(id, value) { const task = this.tasks.find(task => task.id === id); if (task) { value ? task.completedAt = new Date() : task.completedAt = null } ... }`
- Why: The action sets `completedAt` but never flips `task.completed`. A task can end up with `completed: false, completedAt: <date>` (completed but flagged incomplete) or `completed: true, completedAt: null` (if `completed` was set elsewhere). Any UI rendering `task.completed` will be out of sync with `completedAt`.
- Fix sketch: Also set `task.completed = value` inside the same block.

### F2: `getTimersFromLocalStorage` has no try/catch — corrupt localStorage crashes app init [bug]
- File: src/stores/timers.ts:13-22
- Evidence: `const rawTimers = lsTimers ? JSON.parse(lsTimers) : [defaultTimer]` (no try/catch around `JSON.parse`)
- Why: The tasks store wraps `JSON.parse` in a try/catch (line 33-35 of tasks.ts) and falls back gracefully. The timers store does not. If a user manually edits or corrupts the `taskMasterTimers` localStorage entry, `JSON.parse` throws an uncaught exception during module evaluation, crashing the entire app before it mounts.
- Fix sketch: Wrap the parse in try/catch matching the tasks store pattern, returning `[defaultTimer]` on failure.

### F3: `setSelectedTimer` uses `!` on `find()` result — assigns `undefined` when timer is missing [bug]
- File: src/stores/timers.ts:43
- Evidence: `this.selectedTimer = this.timers.find(timer => timer.id === id)!`
- Why: If `id` does not correspond to any timer (e.g., after a race condition or stale UI event), `find` returns `undefined`. The `!` assertion suppresses the type error at compile time but at runtime `selectedTimer` becomes `undefined`, crashing any component that accesses `selectedTimer.duration` or similar.
- Fix sketch: Guard with an existence check and either throw, log, or fall back to a default timer.

### F4: `removeTimer` doesn't update `selectedTimer` — stale reference after removal [bug]
- File: src/stores/timers.ts:39-41
- Evidence: `removeTimer(id) { this.timers = this.timers.filter(timer => timer.id !== id); saveTimersToLocalStorage(this.timers) }`
- Why: If the removed timer is the currently selected one, `selectedTimer` still holds a reference to the detached object. Subsequent UI renders will show a timer that no longer exists in the list. If all timers are removed, `selectedTimer` is stale and `timers` is empty.
- Fix sketch: After filtering, if `selectedTimer.id === id`, set `selectedTimer` to `this.timers[0] ?? null`.

### F5: Duplicated localStorage helpers — shared utility would reduce drift [should-fix]
- File: src/stores/tasks.ts:31-45 and src/stores/timers.ts:11-24
- Evidence: Both stores define `get*FromLocalStorage` (read, parse, default-fallback) and `save*ToLocalStorage` (stringify, setItem) with near-identical structure.
- Why: The two helpers already drifted: tasks has try/catch, timers does not. More stores or persistence targets would multiply the duplication. A generic `loadFromLocalStorage(key, defaultFactory, reviver?)` and `saveToLocalStorage(key, data)` would centralize error handling and make the stores thinner.
- Fix sketch: Extract to a `src/stores/persist.ts` (or `src/utils/`) shared module; have each store import and call it.

### F6: `editTask` silently no-ops when task is not found — no error signal [nit]
- File: src/stores/tasks.ts:59-64
- Evidence: `if (taskIndex !== -1) { ... } saveTasksToLocalStorage(this.tasks)` — no else branch, no thrown error, no return value.
- Why: The caller has no way to know the edit failed. In contrast, `setSelectedTimer` (timers.ts) would crash loudly. Inconsistent error-handling shape makes debugging harder.
- Fix sketch: Either throw `new Error('Task not found')` or return a boolean indicating success.

### F7: Variable shadowing in `findIndex`/`find` callbacks [nit]
- File: src/stores/tasks.ts:60 and src/stores/tasks.ts:68
- Evidence: `findIndex(task => task.id === id)` and `find(task => task.id === id)` — the callback parameter `task` shadows the outer `task` parameter in `editTask(id, task)`.
- Why: While JavaScript handles this correctly (inner scope wins), it reduces readability and can confuse linters or future refactors. The timers store avoids this by using `timer` as the callback variable.
- Fix sketch: Rename callback parameter to `t` or `existingTask` to avoid shadowing.

## Conventions observed
- Options-style Pinia stores via `defineStore` with `state` and `actions` objects (no setup/store-to).
- LocalStorage persistence handled by module-level helper functions (not Pinia plugins).
- UUID v7 (`uuid` package) for all ID generation.
- Default seed data provided in localStorage helpers when storage is empty or corrupt.
- Actions persist synchronously after every mutation (no batched saves).

## Coverage
- Reviewed: src/stores/index.ts, src/stores/tasks.ts, src/stores/timers.ts (all files in the module)
- Skipped: none
