<template>
  <div class="timer-display" :class="mode">
    <template v-if="mode === 'countdown'">
      <div class="mode-label countdown-label">Break starts in {{ displayTimeString }}</div>
      <v-progress-linear
        :model-value="countdownRemaining / 30 * 100"
        color="orange"
        height="8"
        class="mt-2"
      />
    </template>
    <template v-else-if="mode === 'idle'">
      <div class="mode-label idle-label">Ready</div>
    </template>
    <template v-else>
      <div class="mode-label">{{ modeLabel }}</div>
      <div class="time">{{ displayTimeString }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import type { TimerStatus } from '../composables/timerController.ts'

  const props = defineProps<{
    displayTimeString: string
    mode: TimerStatus
    countdownRemaining: number
  }>()

  const modeLabel = computed(() => {
    switch (props.mode) {
      case 'work': {
        return 'Work'
      }
      case 'break': {
        return 'Break'
      }
      default: {
        return ''
      }
    }
  })
</script>

<style scoped lang="scss">
  .timer-display {
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .timer-display.work {
    color: #d84f4f;
  }

  .timer-display.break {
    color: #4caf50;
  }

  .timer-display.countdown {
    color: #ff9800;
  }

  .mode-label {
    font-size: 1rem;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .countdown-label {
    font-size: 1.2rem;
  }

  .idle-label {
    font-size: 1rem;
    opacity: 0.5;
  }

  .time {
    font-size: 2.5rem;
    font-weight: bold;
  }
</style>
