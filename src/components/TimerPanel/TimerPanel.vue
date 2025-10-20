<template>
  <div class="timer-panel">
    <div class="timer-list d-flex">
      <v-button class="add-timer-btn">
        <v-icon>mdi-plus</v-icon>
      </v-button>
    </div>
    <div class="controls"></div>
  </div>
</template>

<script setup lang="ts">
  const activeTimer = ref(null)

</script>

<style scoped lang="scss">

</style>
