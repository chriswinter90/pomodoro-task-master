<template>
  <v-dialog v-model="showPanel" max-width="500">
    <v-card>
      <v-card-title>Add Task</v-card-title>
      <v-form v-model="valid" @submit.prevent="addTask">
        <v-card-text>
          <v-text-field
            v-model="title"
            type="text"
            label="Title"
            autofocus
            required
          />
          <v-text-field v-model="description" type="text" label="Description" />
        </v-card-text>
        <v-card-actions>
          <v-btn type="submit" color="green">
            <v-icon>mdi-plus</v-icon>
            Add Task
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useTaskStore } from '@/stores/tasks.ts'

  const taskStore = useTaskStore()

  const showPanel = defineModel<boolean>({ required: true })

  const valid = ref(false)

  const title = ref('')
  const description = ref('')

  /**
   * Submit the add-task form.
   * Validates title is non-empty, creates task via store, resets form.
   */
  function addTask() {
    if (!title.value.trim()) return
    taskStore.addTask({
      title: title.value,
      description: description.value.trim(),
    })

    title.value = ''
    description.value = ''
    valid.value = false

    showPanel.value = false
  }
</script>
