<template>
  <div class="timer-display">
    {{ displayTimeString }}
  </div>
</template>

<script setup lang="ts">
  defineProps({
    duration: {
      type: Number,
      required: true,
    },
    elapsedSeconds: {
      type: Number,
      required: true,
    },
    displayTimeString: {
      type: String,
      required: true,
    },
  })
</script>

<style scoped lang="scss">

</style>
