<template>
  <div class="timer-controls d-flex flex-row justify-center">
    <v-btn v-if="mode === 'idle'" color="green" @click="emits('start')">Start</v-btn>
    <v-btn v-if="mode === 'work' || mode === 'break'" color="red" @click="emits('stop')">Stop</v-btn>
    <v-btn
      v-if="mode === 'work' || mode === 'break' || mode === 'countdown'"
      color="blue"
      @click="emits('snooze')"
    >
      Snooze
    </v-btn>
    <v-btn v-if="mode === 'countdown'" color="secondary" @click="emits('skip-break')">Skip Break</v-btn>
    <v-btn color="warning" @click="emits('reset')">Reset</v-btn>
  </div>
</template>

<script setup lang="ts">
  import type { BreakMode } from '@/components/composables/breakController.ts'

  defineProps<{
    mode: BreakMode
  }>()
  const emits = defineEmits<{
    'start': []
    'stop': []
    'reset': []
    'snooze': []
    'skip-break': []
  }>()
</script>

<style scoped lang="scss">
.timer-controls > * {
  width: 100px;
  margin: 0 8px;
}
</style>
