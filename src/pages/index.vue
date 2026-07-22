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
  const showPanel = ref(false)
</script>

<style scoped lang="scss">
  .page-container {
    height: 100vh;
    width: 100vw;
  }
</style>
