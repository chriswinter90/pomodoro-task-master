<template>
  <div class="kanban-board">
    <v-row dense>
      <v-col
        v-for="column in columns"
        :key="column.status"
        cols="12"
        md="4"
      >
        <v-card class="kanban-board__card">
          <v-card-title class="d-flex align-center py-3">
            <v-icon :color="column.color" size="small" start>
              {{ column.icon }}
            </v-icon>
            {{ column.title }}
            <v-chip :color="column.color" size="small" variant="tonal" class="ml-auto">
              {{ tasksByStatus[column.status]?.length ?? 0 }}
            </v-chip>
          </v-card-title>
          <v-card-text
            ref="columnRefs"
            class="pa-0 kanban-column"
            :data-status="column.status"
            @dragover.prevent
            @dragenter.prevent="onDragEnter($event)"
            @dragleave="onDragLeave($event)"
            @drop.stop="onDrop($event, column.status)"
          >
            <div
              v-for="task in tasksByStatus[column.status]"
              :key="task.id"
              draggable="true"
              class="kanban-task-card-wrapper"
              @dragstart="onDragStart($event, task.id)"
              @dragend="onDragEnd"
            >
              <div class="kanban-task-card-container">
                <v-card variant="outlined" class="kanban-task-card">
                  <v-card-text class="pa-3">
                    <div class="kanban-task-title">{{ task.title }}</div>
                    <div v-if="task.description" class="kanban-task-description">
                      {{ task.description }}
                    </div>
                  </v-card-text>
                </v-card>
                <v-btn
                  v-if="task.status === 'done'"
                  icon="mdi-delete"
                  color="red"
                  size="x-small"
                  variant="flat"
                  class="kanban-delete-btn"
                  @click="taskStore.removeTask(task.id)"
                />
              </div>
            </div>
            <div v-if="!tasksByStatus[column.status]?.length" class="kanban-empty">
              No tasks
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <div class="kanban-add-row">
      <v-btn
        color="green"
        prepend-icon="mdi-plus"
        @click="emit('add-task')"
      >
        Add Task
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { type TaskStatus, useTaskStore } from '@/stores/tasks.ts'

  const taskStore = useTaskStore()

  const tasksByStatus = computed(() => taskStore.tasksByStatus)

  const emit = defineEmits<{ 'add-task': [] }>()

  const columnRefs = ref<HTMLElement[]>([])

  const columns = [
    { status: 'todo' as TaskStatus, title: 'Todo', color: 'grey', icon: 'mdi-circle-outline' },
    { status: 'in-progress' as TaskStatus, title: 'In Progress', color: 'blue', icon: 'mdi-timer-sand' },
    { status: 'done' as TaskStatus, title: 'Done', color: 'green', icon: 'mdi-check-circle' },
  ]

  function onDragStart(event: DragEvent, taskId: string) {
    event.dataTransfer!.setData('text/plain', taskId)
    event.dataTransfer!.effectAllowed = 'move'
    // Make the drag image slightly transparent
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }
  }

  function onDragEnd(event: DragEvent) {
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = ''
    }
  }

  function onDragEnter(event: DragEvent) {
    const column = event.currentTarget as HTMLElement
    column.style.backgroundColor = 'rgba(25, 118, 210, 0.08)'
  }

  function onDragLeave(event: DragEvent) {
    const column = event.currentTarget as HTMLElement
    // Only clear if we actually left the column (not entering a child)
    if (!column.contains(event.relatedTarget as Node)) {
      column.style.backgroundColor = ''
    }
  }

  function onDrop(event: DragEvent, newStatus: TaskStatus) {
    const column = event.currentTarget as HTMLElement
    column.style.backgroundColor = ''

    const taskId = event.dataTransfer!.getData('text/plain')
    if (!taskId) return

    const task = taskStore.tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    taskStore.setStatus(taskId, newStatus)
  }
</script>

<style scoped lang="scss">
  .kanban-board {
    min-height: fit-content;
  }

  .kanban-board__card {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .kanban-column {
    flex: 1;
    min-height: 150px;
    transition: background-color 0.2s;
  }

  .kanban-task-card-wrapper {
    padding: 0 8px 8px;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    &:hover .kanban-task-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .kanban-task-card-container {
    position: relative;
    width: 100%;
  }

  .kanban-task-card {
    user-select: none;
    pointer-events: none;
    width: 100%;
    display: block;
  }

  .kanban-task-card :deep(.v-card-text) {
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .kanban-delete-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    pointer-events: auto;
    z-index: 1;
  }

  .kanban-task-title {
    font-weight: 500;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .kanban-task-description {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 4px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .kanban-empty {
    text-align: center;
    padding: 24px 8px;
    font-size: 0.875rem;
  }

  .kanban-add-row {
    display: flex;
    justify-content: center;
    margin-top: 8px;
  }
</style>
