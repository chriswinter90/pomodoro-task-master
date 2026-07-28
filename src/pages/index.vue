<template>
  <div class="page-container">
    <div class="title-bar">
      <h1>Task Master 9000</h1>
      <SettingsDialog v-model="settingsOpen" />
    </div>
    <TaskPanel
      v-if="viewMode === 'list'"
      class="mb-8"
      @add-task="showPanel = true"
    />
    <KanbanBoard v-else-if="viewMode === 'kanban'" class="mb-8" @add-task="showPanel = true" />
    <AddTaskPanel v-model="showPanel" />
    <TimerPanel />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  import { useUserPreferencesStore } from '@/stores/userPreferences'

  const showPanel = ref(false)
  const settingsOpen = ref(false)
  const prefsStore = useUserPreferencesStore()
  const viewMode = computed(() => prefsStore.listView)
</script>

<style scoped lang="scss">
  .page-container {
    height: 100vh;
    width: 100vw;
  }
  .title-bar {
    display: flex;
    justify-content: space-between;
    margin: 5px 5px
  }
</style>
