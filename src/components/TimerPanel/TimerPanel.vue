<template>
  <div class="timer-panel">
    <div class="d-flex justify-space-around">
      <div class="timer-list d-flex flex-wrap ml-8 mr-8 mb-8">
        <template v-for="timer in timers.timers" :key="timer.id">
          <TimerBlock
            :timer-id="timer.id"
            :duration="timer.duration"
            :break-duration="timer.breakDuration ?? 300"
          />
        </template>
        <v-btn class="add-timer-btn h-auto" border="md" color="green" @click="showAddTimerPanel = true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
    <TimerControls
      :mode="controller.mode"
      :sound-enabled="sound.soundEnabled"
      @start="controller.start()"
      @stop="controller.stop()"
      @reset="controller.reset()"
      @snooze="showSnoozePanel = true"
      @skip-break="controller.skipBreak()"
      @toggle-sound="sound.soundEnabled.value = !sound.soundEnabled.value"
    />
    <TimerDisplay
      :display-time-string="controller.displayTimeString"
      :mode="controller.mode"
      :countdown-remaining="controller.countdownRemaining"
    />
    <AddTimerPanel v-model="showAddTimerPanel" />
    <SnoozePanel v-model="showSnoozePanel" @confirm="handleSnoozeConfirm" />
  </div>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'
  import { useBreakController } from '@/components/composables/breakController.ts'
  import { useSound } from '@/components/composables/sound.ts'
  import AddTimerPanel from '@/components/TimerPanel/AddTimerPanel.vue'
  import SnoozePanel from '@/components/TimerPanel/SnoozePanel.vue'

  const timers = useTimersStore()

  const sound = useSound()

  const showAddTimerPanel = ref(false)
  const showSnoozePanel = ref(false)

  const controller = ref(useBreakController(
    timers.selectedTimer ?? timers.timers[0]!,
  ))

  watch(() => timers.selectedTimer, selectedTimer => {
    if (!selectedTimer) return
    controller.value.dispose()
    controller.value = useBreakController(selectedTimer)
  })

  function handleSnoozeConfirm(duration: number) {
    controller.value.snooze(duration)
  }
</script>

<style scoped lang="scss">
  .timer-list > * {
    width: 100px;
    margin: 10px;
  }
</style>
