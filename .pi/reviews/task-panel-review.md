# Review: src/components/TaskPanel

## Findings

### F1: Manual modal instead of `<v-dialog>` — reinventing the wheel [should-fix]
- File: AddTaskPanel.vue:2-22
- Evidence:
  ```html
  <div class="add-task-panel" v-if="showPanel">
    <v-overlay />
    <v-card width="500" height="300">
  ```
  ```scss
  .add-task-panel { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999; }
  .v-card { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
  ```
- Why: Vuetify provides `<v-dialog>` which handles overlay, centering, focus trapping, ESC-to-close, and screen-reader accessibility out of the box. This manual implementation duplicates all that logic and misses accessibility features (no focus trap, no ARIA roles, no ESC handling).
- Fix sketch: Replace the custom overlay + card with `<v-dialog v-model="showPanel" max-width="500"><v-card>...</v-card></v-dialog>` and remove the manual positioning styles.

### F2: Form validation not enforced on submit [bug]
- File: AddTaskPanel.vue:25
- Evidence:
  ```ts
  function addTask() {
    taskStore.addTask({
      title: title.value,
      description: description.value,
    })
  ```
- Why: The form tracks `valid` via `v-model="valid"` on `<v-form>`, but `addTask()` never checks `valid.value` before dispatching. A user can submit a task with an empty title (and empty description). There are also no `rules` or `:counter` props on the text fields to drive validation state.
- Fix sketch: Add `if (!valid.value) return` at the top of `addTask`, and add `rules` or `required` props to `<v-text-field>` so Vuetify drives the validity state.

### F3: Double mutation on task completion — inconsistent state update [bug]
- File: TaskPanel.vue:17-19
- Evidence:
  ```html
  <v-checkbox
    v-model="task.completed"
    @update:model-value="taskStore.setCompletedAt(task.id, $event as boolean)"
  />
  ```
- Why: `v-model="task.completed"` directly mutates the task object inside the Pinia store array, bypassing store actions. Meanwhile `@update:model-value` calls `setCompletedAt`, which only sets `completedAt` (not `completed`). The `completed` boolean and `completedAt` timestamp are updated through two different paths — one direct mutation, one store action. If `setCompletedAt` fails (e.g., task not found), `completed` is already flipped. The `$event as boolean` type assertion in the template is also a code smell indicating a type mismatch.
- Fix sketch: Replace `v-model` with `:model-value` + `@update:model-value="onToggleComplete(task, $event)"` where a single function calls `taskStore.setCompletedAt(task.id, value)` and the store action sets both `task.completed` and `task.completedAt`.

### F4: Submit button outside `<v-form>` — validation bypass on click [should-fix]
- File: AddTaskPanel.vue:8-10, 15-19
- Evidence:
  ```html
  <v-form v-model="valid" @submit.prevent="addTask">
    <v-text-field v-model="title" ... />
    <v-text-field v-model="description" ... />
  </v-form>
  <v-btn @click="addTask()">...</v-btn>
  ```
- Why: The button is a sibling of `<v-form>`, not a child. Clicking it invokes `addTask()` directly, bypassing the form's `@submit` handler. While both paths happen to call the same function today, this is fragile — if validation logic is later added to `@submit`, button clicks would skip it.
- Fix sketch: Move the `<v-btn type="submit">` inside `<v-form>` and remove the redundant `@click` handler.

### F5: `valid` ref not reset after submission [should-fix]
- File: AddTaskPanel.vue:28-32
- Evidence:
  ```ts
  title.value = ''
  description.value = ''
  // valid is NOT reset
  showPanel.value = false
  ```
- Why: After clearing title and description, `valid` retains its previous value. If the panel reopens without a full remount, `valid` could be `true` even though the fields are now empty, misleading subsequent validation checks.
- Fix sketch: Add `valid.value = false` after clearing the field refs, or use `v-form`'s `.reset()` method if available.

### F6: Untyped `defineEmits` — loses type safety [nit]
- File: TaskPanel.vue:53
- Evidence:
  ```ts
  const emit = defineEmits(['add-task'])
  ```
- Why: The runtime string-array form provides no compile-time checking of emit names or payloads. The project convention is `<script setup lang="ts">`, so the type-safe generic form should be used.
- Fix sketch: `const emit = defineEmits<{ 'add-task': [] }>()`

### F7: Inconsistent function-call style in template [nit]
- File: AddTaskPanel.vue:8 vs 16
- Evidence:
  ```html
  @submit.prevent="addTask"    <!-- function reference -->
  @click="addTask()"           <!-- explicit call -->
  ```
- Why: Mixing reference and call style is inconsistent. Both work in Vue templates, but the team should pick one convention.
- Fix sketch: Use `@click="addTask"` (no parens) for consistency with `@submit.prevent="addTask"`.

### F8: Trailing whitespace in class attribute [nit]
- File: TaskPanel.vue:28
- Evidence:
  ```html
  <v-list-item class="d-flex ">
  ```
- Why: Trailing space after `d-flex` is dead text that adds no value.
- Fix sketch: Remove the trailing space: `class="d-flex"`.

### F9: Missing JSDoc on `addTask` function [nit]
- File: AddTaskPanel.vue:25
- Evidence:
  ```ts
  function addTask() {
  ```
- Why: The function has no JSDoc comment describing its purpose, parameters, or side effects. The brief lists missing JSDoc as a review criterion.
- Fix sketch: Add `/** Submit the form, create a task, and close the panel. */` above the function.

### F10: Panel closed via direct `defineModel` mutation — no parent intercept [consistency]
- File: AddTaskPanel.vue:31
- Evidence:
  ```ts
  showPanel.value = false
  ```
- Why: TaskPanel communicates with its parent via `defineEmits`. AddTaskPanel mutates the shared `defineModel` directly to close itself. While `defineModel` is the stated convention, closing without an emit means the parent cannot intercept, confirm, or react to the close event. Consider emitting a `close` or `saved` event alongside (or instead of) the model mutation.
- Fix sketch: Emit `'close'` or `'saved'` event and let the parent set `showPanel = false`, or keep the model mutation but also emit for observability.

## Conventions observed
- `<script setup lang="ts">` used consistently across both files.
- Pinia store imported via `useTaskStore()` from `@/stores/tasks.ts`.
- `defineModel` used in AddTaskPanel for v-model binding; `defineEmits` used in TaskPanel for parent communication.
- Scoped SCSS styles present in both files. Vuetify utility classes (`d-flex`) used in templates.

## Coverage
- Reviewed: `src/components/TaskPanel/TaskPanel.vue` (55 lines), `src/components/TaskPanel/AddTaskPanel.vue` (45 lines)
- Skipped: none
