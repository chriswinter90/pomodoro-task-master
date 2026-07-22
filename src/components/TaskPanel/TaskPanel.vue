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
            <v-checkbox
              class="d-flex"
              :model-value="task.completed"
              @update:model-value="handleComplete(task.id, Boolean($event))"
            />
          </template>
          <template #append>
            <v-btn
              class="d-flex"
              v-if="task.completed"
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
  import { useTaskStore } from '@/stores/tasks.ts'

  const taskStore = useTaskStore()

  const tasks = computed(() => taskStore.tasks)

  const emit = defineEmits<{ 'add-task': [] }>()

  function handleComplete(id: string, newValue: boolean) {
    taskStore.setCompletedAt(id, newValue)
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
</style>
