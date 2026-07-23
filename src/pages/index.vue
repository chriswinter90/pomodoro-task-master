<template>
  <div class="page-container">
    <div class="d-flex align-center mb-4">
      <v-btn-toggle v-model="viewMode" class="mr-4" density="compact" mandatory>
        <v-btn value="list">
          <v-icon start>mdi-format-list-checks</v-icon>
          List
        </v-btn>
        <v-btn value="kanban">
          <v-icon start>mdi-board</v-icon>
          Kanban
        </v-btn>
      </v-btn-toggle>
    </div>
    <TaskPanel
      v-if="viewMode === 'list'"
      class="mb-8"
      @add-task="showPanel = true"
    />
    <KanbanBoard v-else class="mb-8" @add-task="showPanel = true" />
    <AddTaskPanel v-model="showPanel" />
    <TimerPanel />
  </div>
</template>

<script setup lang="ts">
  const showPanel = ref(false)
  const viewMode = ref<'list' | 'kanban'>('list')
</script>

<style scoped lang="scss">
  .page-container {
    height: 100vh;
    width: 100vw;
  }
</style>
