<template>
  <div
    :class="{
      'timer-block': true,
      active: isActive
    }"
    @click="timers.setSelectedTimer(timerId)"
  >
    <v-icon size="36">mdi-clock</v-icon>
    {{ timerDisplay }}
  </div>
</template>

<script setup lang="ts">
  import { displayTime } from '@/components/composables/timer.ts'
  import { useTimersStore } from '@/stores/timers.ts'

  const props = defineProps({
    timerId: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  })

  const timers = useTimersStore()

  const isActive = computed(() => timers.selectedTimer?.id === props.timerId)

  const timerDisplay = computed(() => displayTime(props.duration))

</script>

<style scoped lang="scss">
.timer-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.timer-block.active {
    background-color: #d84f4f;
  }
  .timer-block:hover {
    cursor: pointer;
    background-color: #f0f0f0;
  }
</style>
