<template>
  <TaskPanel
    @add-task="showPanel = true"
  />
  <add-task-panel v-model="showPanel" />
</template>

<script lang="ts" setup>
  import TaskPanel from '@/components/TaskPanel/TaskPanel.vue'

  const showPanel = ref(false)
</script>

<style scoped lang="scss">
  .task-panel {
    width: 100%;
  }
</style>
