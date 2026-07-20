# Brief: Review TaskPanel — fix bugs, simplify UI, add JSDoc
Status: SCOPED
Created: 2026-07-20
Base: 1e97a5f1d3e0a092ff3afddfe4e4e81729015415

## Goal
Fix 10 findings from the code review of `src/components/TaskPanel`: 2 correctness bugs, 3 simplification opportunities, and 5 nits/consistency issues. Replace manual modal with `<v-dialog>`, fix double mutation on task completion, and add JSDoc.

## Findings

### F1: Manual modal instead of `<v-dialog>` [should-fix]
- File: AddTaskPanel.vue:2-22
- Evidence: Custom fixed div + `<v-overlay />` + positioned `<v-card>` with manual SCSS
- Why: Missing accessibility (no focus trap, no ARIA, no ESC-to-close). `<v-dialog>` provides all this.
- Fix: Replace with `<v-dialog v-model="showPanel" max-width="500">`

### F2: Form validation not enforced [bug]
- File: AddTaskPanel.vue:25
- Evidence: `addTask()` never checks `valid.value`; text fields have no `rules` or `required`
- Why: Empty titles can be submitted
- Fix: Add `if (!valid.value) return` and `required` prop on title field

### F3: Double mutation on task completion [bug]
- File: TaskPanel.vue:17-19
- Evidence: `v-model="task.completed"` + `@update:model-value="taskStore.setCompletedAt(...)"`
- Why: Direct mutation bypasses store action; `setCompletedAt` doesn't set `completed` (see stores review F1)
- Fix: Replace `v-model` with `:model-value` + single handler calling the store action

### F4: Submit button outside `<v-form>` [should-fix]
- File: AddTaskPanel.vue:8-10, 15-19
- Evidence: `<v-btn>` is sibling of `<v-form>`, not child
- Why: Click bypasses form's `@submit` handler
- Fix: Move button inside form as `<v-btn type="submit">`

### F5: `valid` ref not reset after submission [should-fix]
- File: AddTaskPanel.vue:28-32
- Evidence: Title/description cleared but `valid` retains old value
- Fix: Add `valid.value = false` after clearing fields

### F6: Untyped `defineEmits` [nit]
- File: TaskPanel.vue:53
- Evidence: `defineEmits(['add-task'])`
- Fix: `defineEmits<{ 'add-task': [] }>()`

### F7: Inconsistent call style [nit]
- File: AddTaskPanel.vue:8 vs 16
- Evidence: `@submit.prevent="addTask"` vs `@click="addTask()"`
- Fix: Use `@click="addTask"` (no parens)

### F8: Trailing whitespace [nit]
- File: TaskPanel.vue:28
- Evidence: `class="d-flex "`
- Fix: Remove trailing space

### F9: Missing JSDoc [nit]
- File: AddTaskPanel.vue:25
- Fix: Add JSDoc to `addTask` function

### F10: Panel close via direct model mutation [consistency]
- File: AddTaskPanel.vue:31
- Evidence: `showPanel.value = false` without emitting
- Fix: Emit `'close'` event alongside model mutation for parent observability

## Key Files
- src/components/TaskPanel/TaskPanel.vue — task list UI, has F3, F6, F8
- src/components/TaskPanel/AddTaskPanel.vue — add-task modal, has F1, F2, F4-F10
- src/stores/tasks.ts — `setCompletedAt` action (F3 depends on stores review F1 being fixed)

## Interview
- User chose to include all 10 findings in the brief.

## Approach
1. Fix F3 first (depends on stores F1 being fixed — coordinate ordering)
2. Fix F2 — add validation check and `required` prop
3. Fix F1 — replace manual modal with `<v-dialog>`
4. Fix F4 — move submit button inside form
5. Fix F5 — reset `valid` after submission
6. Fix F6-F10 — mechanical improvements (typed emits, call style, whitespace, JSDoc, emit event)

## Rejected Alternatives
- None — all findings accepted.

## Open Questions
- Should the add-task panel emit a `close` event (F10) or is `defineModel` mutation sufficient?

## Out of Scope
- TimerPanel, composables, stores (separate brief), router, plugins, layouts, pages

## Constraints
- `<script setup lang="ts">` SFC style
- Vuetify 3 components
- Auto-imported Vue composition API
- Pinia stores from `@/stores/`
- SCSS scoped styles

## Verification
- `pnpm type-check` passes
- `pnpm lint` passes
- Manual: tasks can be added with non-empty title, completed, removed
- Manual: add-task dialog closes on ESC, traps focus
- Manual: clicking "Add Task" button enforces validation
