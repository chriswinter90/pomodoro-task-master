<template>
  <div class="page-container">
    <TaskPanel
      class="mb-8"
      @add-task="showPanel = true"
    />
    <add-task-panel v-model="showPanel" />
    <TimerPanel />
  </div>
</template>

<script lang="ts" setup>
  import TaskPanel from '@/components/TaskPanel/TaskPanel.vue'
  import TimerPanel from '@/components/TimerPanel/TimerPanel.vue'

  const showPanel = ref(false)
</script>

<style scoped lang="scss">
  .page-container {
    height: 100vh;
    width: 100vw;
  }
  .task-panel {
    width: 100%;
  }
</style>
