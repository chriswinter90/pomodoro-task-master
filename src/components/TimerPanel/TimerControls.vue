<template>
  <div class="timer-controls d-flex flex-row justify-center">
    <v-btn color="green" @click="emits('start')">Start</v-btn>
    <v-btn color="red" @click="emits('stop')">Stop</v-btn>
    <v-btn color="warning" @click="emits('reset')">Reset</v-btn>
  </div>
</template>

<script setup lang="ts">

const emits = defineEmits(['start', 'stop', 'reset'])

</script>

<style scoped lang="scss">
.timer-controls > * {
  width: 100px;
  margin: 0 8px;
}
</style>
