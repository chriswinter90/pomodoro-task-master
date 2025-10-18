<template>
  <div class="add-task-panel" v-if="showPanel">
    <v-overlay />
    <v-card width="500" height="300">
      <v-card-title>Add Task</v-card-title>
      <v-form v-model="valid" @submit.prevent="addTask">
        <v-text-field v-model="title" type="text" label="Title" autofocus />
        <v-text-field v-model="description" type="text" label="Description" />
      </v-form>
      <v-btn
        color="green"
        @click="addTask()"
      >
        <v-icon>mdi-plus</v-icon>
        Add Task
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import { useTaskStore } from '@/stores/tasks.ts'

  const taskStore = useTaskStore()

  const showPanel = defineModel<boolean>({ required: true })

  const valid = ref(false)

  const title = ref('')
  const description = ref('')

  function addTask() {
    taskStore.addTask({
      title: title.value,
      description: description.value,
    })

    title.value = ''
    description.value = ''

    showPanel.value = false
  }
</script>

<style scoped lang="scss">
  .add-task-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
  }

  .v-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid darkred;
    padding: 20px;
  }
</style>
