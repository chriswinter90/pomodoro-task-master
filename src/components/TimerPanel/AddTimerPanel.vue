<template>
  <v-dialog class="add-timer-panel" v-model="showPanel">
    <v-card width="500">
      <v-card-title>Add Timer</v-card-title>
      <v-form class="d-flex flex-column" v-model="valid" @submit.prevent="addTimer">
        <v-card-text>
          <v-card-subtitle>Work duration</v-card-subtitle>
          <div class="d-flex flex-row">
            <v-number-input
              v-model="minutes"
              label="Minutes"
              control-variant="stacked"
              autofocus
            />
            <div class="colon-separator">
              :
            </div>
            <v-number-input
              v-model="seconds"
              :min="0"
              :max="59"
              control-variant="stacked"
              label="Seconds"
            />
          </div>
          <v-card-subtitle class="mt-4">Break duration</v-card-subtitle>
          <div class="d-flex flex-row">
            <v-number-input
              v-model="breakMinutes"
              label="Minutes"
              control-variant="stacked"
            />
            <div class="colon-separator">:</div>
            <v-number-input
              v-model="breakSeconds"
              :min="0"
              :max="59"
              control-variant="stacked"
              label="Seconds"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="green"
            @click="addTimer()"
          >
            <v-icon>mdi-plus</v-icon>
            Add Timer
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'

  const timersStore = useTimersStore()

  const showPanel = defineModel<boolean>({ required: true })

  const valid = ref(false)

  const minutes = ref(0)
  const seconds = ref(0)
  const breakMinutes = ref(5)
  const breakSeconds = ref(0)

  function addTimer() {
    const workDuration = minutes.value * 60 + seconds.value
    const breakDuration = breakMinutes.value * 60 + breakSeconds.value
    timersStore.addTimer(workDuration, breakDuration)

    minutes.value = 0
    seconds.value = 0
    breakMinutes.value = 5
    breakSeconds.value = 0

    showPanel.value = false
  }
</script>

<style scoped lang="scss">
  .add-timer-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
  }

  .v-card {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid darkred;
    padding: 20px;
  }

  .v-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .colon-separator {
    padding: 0 5px 23px 5px;
    align-content: center;
    font-size: 33px;
  }
</style>
