<template>
  <div class="add-timer-panel" v-if="showPanel">
    <v-overlay />
    <v-card width="500">
      <v-card-title>Add Timer</v-card-title>
      <v-form v-model="valid" @submit.prevent="addTimer">
        <v-card-subtitle>Work duration</v-card-subtitle>
        <v-number-input
          v-model="minutes"
          label="Minutes"
          control-variant="stacked"
          autofocus
        />
        :
        <v-number-input
          v-model="seconds"
          :min="0"
          :max="59"
          control-variant="stacked"
          label="Seconds"
        />
        <v-card-subtitle class="mt-4">Break duration</v-card-subtitle>
        <v-number-input
          v-model="breakMinutes"
          label="Minutes"
          control-variant="stacked"
        />
        :
        <v-number-input
          v-model="breakSeconds"
          :min="0"
          :max="59"
          control-variant="stacked"
          label="Seconds"
        />
      </v-form>
      <v-btn
        color="green"
        @click="addTimer()"
      >
        <v-icon>mdi-plus</v-icon>
        Add Timer
      </v-btn>
    </v-card>
  </div>
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
</style>
