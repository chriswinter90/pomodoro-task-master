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
    <div class="break-duration">
      <v-icon size="16">mdi-coffee</v-icon>
      {{ breakDisplay }}
    </div>
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
    breakDuration: {
      type: Number,
      required: true,
    },
  })

  const timers = useTimersStore()

  const isActive = computed(() => timers.selectedTimer?.id === props.timerId)

  const timerDisplay = computed(() => displayTime(props.duration))

  const breakDisplay = computed(() => displayTime(props.breakDuration))

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
  .break-duration {
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
    opacity: 0.8;
  }

  .timer-block.active {
    background-color: #d84f4f;
  }
  .timer-block:hover {
    cursor: pointer;
    background-color: #f0f0f0;
  }
</style>
