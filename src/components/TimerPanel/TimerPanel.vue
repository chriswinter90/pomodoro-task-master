<template>
  <div class="timer-panel">
    <div class="d-flex justify-space-around">
      <div class="timer-list d-flex flex-wrap ml-8 mr-8 mb-8">
        <template v-for="timer in timers.timers" :key="timer.id">
          <TimerBlock
            :timer-id="timer.id"
            :duration="timer.duration"
            :break-duration="timer.breakDuration ?? 300"
            :show-delete="timers.timers.length > 1"
            @delete="handleDeleteRequest"
          />
        </template>
        <v-btn class="add-timer-btn h-auto" border="md" color="green" @click="showAddTimerPanel = true">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
    <TimerControls
      :mode="timerState.mode"
      @start="controller.start()"
      @stop="controller.stop()"
      @reset="controller.reset()"
      @snooze="showSnoozePanel = true"
      @skip-break="controller.skipBreak()"
    />
    <TimerDisplay
      :display-time-string="controller.displayTimeString"
      :mode="timerState.mode"
      :countdown-remaining="controller.countdownRemaining"
    />
    <AddTimerPanel v-model="showAddTimerPanel" />
    <SnoozePanel v-model="showSnoozePanel" @confirm="handleSnoozeConfirm" />

    <v-dialog class="delete-timer-dialog" v-model="showDeleteDialog" data-test="delete-timer-dialog">
      <v-card width="400">
        <v-card-title>Delete Timer</v-card-title>
        <v-card-text>Are you sure you want to delete this timer?</v-card-text>
        <v-card-actions>
          <v-btn color="red" data-test="confirm-delete" @click="confirmDelete">
            <v-icon>mdi-delete</v-icon>
            Delete
          </v-btn>
          <v-btn data-test="cancel-delete" @click="cancelDelete">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'
  import { useTimerStateStore } from '@/stores/timerState.ts'
  import { useTimerController } from '../composables/timerController.ts'
  import AddTimerPanel from '@/components/TimerPanel/AddTimerPanel.vue'
  import SnoozePanel from '@/components/TimerPanel/SnoozePanel.vue'

  const timers = useTimersStore()
  const timerState = useTimerStateStore()

  const showAddTimerPanel = ref(false)
  const showSnoozePanel = ref(false)
  const showDeleteDialog = ref(false)
  const pendingDeleteId = ref<string | null>(null)

  const controller = ref(useTimerController(
    timers.selectedTimer ?? timers.timers[0]!,
  ))

  watch(() => timers.selectedTimer, (selectedTimer) => {
    controller.value.dispose()
    if (!selectedTimer) return
    controller.value = useTimerController(selectedTimer)
  })

  function handleSnoozeConfirm(duration: number) {
    controller.value.snooze(duration)
  }

  function handleDeleteRequest(id: string) {
    pendingDeleteId.value = id
    showDeleteDialog.value = true
  }

  function confirmDelete() {
    if (pendingDeleteId.value) {
      timers.removeTimer(pendingDeleteId.value)
      pendingDeleteId.value = null
    }
    showDeleteDialog.value = false
  }

  function cancelDelete() {
    pendingDeleteId.value = null
    showDeleteDialog.value = false
  }
</script>

<style scoped lang="scss">
  .timer-list > * {
    width: 100px;
    margin: 10px;
  }

  .delete-timer-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    .v-card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 20px;
    }
  }
</style>
