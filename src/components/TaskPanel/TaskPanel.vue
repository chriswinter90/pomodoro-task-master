<template>
  <div class="task-panel">
    <v-list>
      <template
        v-for="task in tasks"
        :key="task.id"
      >
        <v-list-item class="d-flex">
          <template #prepend>
            <v-chip
              size="small"
              :color="statusColor(task.status)"
              variant="tonal"
              class="status-badge mr-2"
              @click="cycleStatus(task.id)"
            >
              {{ statusLabel(task.status) }}
            </v-chip>
          </template>
          <div class="task-item-content">
            <div class="task-item-title">{{ task.title }}</div>
            <div v-if="task.description" class="task-item-description">
              {{ task.description }}
            </div>
          </div>
          <template #append>
            <v-btn
              class="d-flex"
              v-if="task.status === 'done'"
              color="red"
              icon="mdi-delete"
              @click="taskStore.removeTask(task.id)"
            />
          </template>
        </v-list-item>
        <v-divider />
      </template>

      <v-list-item class="d-flex">
        <v-btn
          class="add-button"
          color="green"
          @click="emit('add-task')"
        >
          <v-icon>mdi-plus</v-icon>
          Add Task
        </v-btn>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
  import { type TaskStatus, useTaskStore } from '@/stores/tasks.ts'

  const taskStore = useTaskStore()

  const tasks = computed(() => taskStore.tasks)

  const emit = defineEmits<{ 'add-task': [] }>()

  const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done']

  function statusColor(status: TaskStatus): string {
    switch (status) {
      case 'todo': { return 'grey' }
      case 'in-progress': { return 'blue'
      }
      case 'done': { return 'green'
      }
    }
  }

  function statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'todo': { return 'Todo' }
      case 'in-progress': { return 'In Progress' }
      case 'done': { return 'Done' }
    }
  }

  function cycleStatus(id: string) {
    const task = taskStore.tasks.find(t => t.id === id)
    if (!task) return

    const currentIndex = statusOrder.indexOf(task.status)
    const nextIndex = (currentIndex + 1) % statusOrder.length
    taskStore.setStatus(id, statusOrder[nextIndex]!)
  }
</script>

<style scoped lang="scss">
  .v-list-item :deep(.v-list-item__content) {
    width: -webkit-fill-available;
  }

  .task-item-content {
    width: -webkit-fill-available;
  }

  .task-item-title {
    font-weight: 500;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .task-item-description {
    font-size: 0.875rem;
    opacity: 0.7;
    margin-top: 4px;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .add-button {
    display: flex;
    justify-self: center;
  }

  .status-badge {
    cursor: pointer;
    min-width: 90px;
  }
</style>
