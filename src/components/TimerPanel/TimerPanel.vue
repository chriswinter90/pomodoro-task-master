<template>
  <div class="timer-panel">
    <div class="d-flex justify-space-around">
      <div class="timer-list d-flex flex-wrap ml-8 mr-8 mb-8">
        <template v-for="timer in timers.timers" :key="timer.id">
          <TimerBlock :timer-id="timer.id" :duration="timer.duration" />
        </template>
        <v-btn class="add-timer-btn h-auto" border="md" color="green" @click="showAddTimerPanel = true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
    <TimerControls
      :is-running="currentTimer.timerRunning"
      @start="currentTimer.startTimer()"
      @stop="currentTimer.stopTimer()"
      @reset="currentTimer.resetTimer()"
    />
    <TimerDisplay
      v-if="currentTimer"
      :key="currentTimer.timerId"
      :elapsed-seconds="currentTimer.elapsedSeconds"
      :duration="currentTimer.duration"
      :display-time-string="currentTimer.displayTimeString"
    />
    <AddTimerPanel v-model="showAddTimerPanel" />
  </div>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'
  import { useTimer } from '@/components/composables/timer.ts'
  import AddTimerPanel from '@/components/TimerPanel/AddTimerPanel.vue'

  const timers = useTimersStore()

  const showAddTimerPanel = ref(false)

  const currentTimer = ref(useTimer(timers.selectedTimer.duration, timers.selectedTimer.id))

  watch(() => timers.selectedTimer, selectedTimer => {
    currentTimer.value = useTimer(selectedTimer.duration, selectedTimer.id)
  }, { deep: true })
</script>

<style scoped lang="scss">
  .timer-list > * {
    width: 100px;
    margin: 10px;
  }
</style>
