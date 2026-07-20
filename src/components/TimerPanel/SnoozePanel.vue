<template>
  <div class="snooze-panel" v-if="showPanel">
    <v-overlay @click="showPanel = false" />
    <v-card width="500" height="320">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Snooze</span>
        <v-btn icon="mdi-close" variant="text" @click="showPanel = false" />
      </v-card-title>
      <div v-if="showError" class="error-message">Duration must be greater than 0</div>
      <div class="preset-buttons">
        <v-btn color="primary" @click="confirmPreset(300)">5 min</v-btn>
        <v-btn color="primary" @click="confirmPreset(600)">10 min</v-btn>
        <v-btn color="primary" @click="confirmPreset(900)">15 min</v-btn>
      </div>
      <v-divider class="my-4" />
      <v-form v-model="valid" @submit.prevent="confirmCustom">
        <v-number-input
          v-model="minutes"
          label="Minutes"
          control-variant="stacked"
        />
        :
        <v-number-input
          v-model="seconds"
          :min="0"
          :max="59"
          control-variant="stacked"
          label="Seconds"
        />
        <v-btn color="primary" type="submit" :disabled="!valid">
          Confirm
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  const showPanel = defineModel<boolean>({ required: true })
  const emit = defineEmits<{
    confirm: [duration: number]
  }>()

  const valid = ref(false)
  const minutes = ref(0)
  const seconds = ref(0)
  const showError = ref(false)

  function confirmPreset(duration: number) {
    emit('confirm', duration)
    showPanel.value = false
  }

  function confirmCustom() {
    const totalSeconds = minutes.value * 60 + seconds.value
    if (totalSeconds > 0) {
      emit('confirm', totalSeconds)
      showPanel.value = false
    } else {
      showError.value = true
    }
  }
</script>

<style scoped lang="scss">
  .snooze-panel {
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

  .preset-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .v-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }

  .error-message {
    color: red;
    font-size: 0.875rem;
    text-align: center;
  }
</style>
