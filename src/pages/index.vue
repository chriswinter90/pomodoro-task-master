<template>
  <div class="page-container">
    <SettingsDialog v-model="settingsOpen" />
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
  import { useUserPreference } from '@/composables/useUserPreference'

  const showPanel = ref(false)
  const settingsOpen = ref(false)
  const { value: savedView } = useUserPreference('taskMasterDefaultView', 'kanban')
  const raw = savedView.value as string
  const viewMode = ref<'list' | 'kanban'>((raw === 'list' || raw === 'kanban') ? raw : 'kanban')
</script>

<style scoped lang="scss">
  .page-container {
    height: 100vh;
    width: 100vw;
  }
</style>
