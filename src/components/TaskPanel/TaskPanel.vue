<template>
  <div class="task-panel">
    <v-list>
      <template
        v-for="task in tasks"
        :key="task.id"
      >
        <v-list-item
          class="d-flex"
          :title="task.title"
          :subtitle="task.description"
        >
          <template #prepend>
            <v-chip
              size="small"
              :color="statusColor(task.status)"
              variant="tonal"
              class="status-badge mr-2 justify-center"
              @click="cycleStatus(task.id)"
            >
              {{ statusLabel(task.status) }}
            </v-chip>
          </template>
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
      case 'todo': { return 'grey'
      }
      case 'in-progress': { return 'blue'
      }
      case 'done': { return 'green'
      }
    }
  }

  function statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'todo': { return 'Todo'
      }
      case 'in-progress': { return 'In Progress'
      }
      case 'done': { return 'Done'
      }
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

  .add-button {
    display: flex;
    justify-self: center;
  }

  .status-badge {
    cursor: pointer;
    min-width: 90px;
  }
</style>
