<template>
  <div class="timer-panel">
    <div class="timer-list d-flex ml-8 mr-8">
      <template v-for="timer in timers.timers" :key="timer.id">
        <TimerBlock :timer-id="timer.id" :duration="timer.duration" />
      </template>
      <v-btn class="add-timer-btn h-auto" border="md" color="green">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
    <div class="controls d-flex flex-row justify-center">
      <v-btn color="green">Start</v-btn>
      <v-btn color="red">Stop</v-btn>
      <v-btn color="warning">Reset</v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTimersStore } from '@/stores/timers.ts'

  const timers = useTimersStore()

</script>

<style scoped lang="scss">
  .timer-list > * {
    width: 100px;
    margin-right: 10px;
  }
  .controls > * {
    width: 100px;
    margin: 0 10px;
  }
</style>
