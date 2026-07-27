<template>
  <div>
    <v-switch
      v-model="soundEnabledPref"
      label="Sounds"
      hide-details
      class="mb-4"
    />

    <div v-for="soundType in soundTypes" :key="soundType" class="sound-section mb-4">
      <h3>{{ getSoundLabel(soundType) }}</h3>

      <v-switch
        :model-value="perTypeEnabled[soundType]"
        @update:model-value="togglePerType(soundType)"
        :label="`Enable ${getSoundLabel(soundType)}`"
        :disabled="!store.soundEnabled"
        hide-details
        class="mb-2"
      />

      <div v-for="(freq, index) in soundFreqs[soundType]" :key="index" class="d-flex mb-2">
        <v-text-field
          v-model="soundFreqs[soundType][index]"
          type="number"
          step="0.01"
          min="20"
          max="20000"
          label="Frequency (Hz)"
          hide-details
          density="compact"
          class="mr-2"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="removeFrequency(soundType, index)"
        />
      </div>

      <v-btn
        variant="text"
        prepend-icon="mdi-plus"
        @click="addFrequency(soundType)"
      >
        Add Frequency
      </v-btn>

      <v-text-field
        v-model="soundDurations[soundType]"
        type="number"
        step="1"
        label="Note Duration (ms)"
        hide-details
        density="compact"
        class="mt-2"
      />

      <v-btn
        color="primary"
        variant="tonal"
        class="mt-2"
        @click="saveSoundConfig(soundType)"
      >
        Save
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive } from 'vue'
  import { type SoundTypeStr, useUserPreferencesStore } from '@/stores/userPreferences'
  import { type SoundConfig, SoundType, useSound } from '@/components/composables/sound'

  const store = useUserPreferencesStore()
  const { getConfig, setConfig } = useSound()

  const soundTypes = Object.values(SoundType)

  function getSoundLabel(type: SoundType): string {
    return type === SoundType.WorkEnd ? 'Work End' : 'Break End'
  }

  // Global sound toggle — reads from store, writes directly
  const soundEnabledPref = computed({
    get: () => store.soundEnabled,
    set: (value: boolean) => {
      store.soundEnabled = value
    },
  })

  // Per-type toggles — reads from store, writes via toggle function
  const perTypeEnabled = computed(() => {
    const result: Record<SoundType, boolean> = {} as Record<SoundType, boolean>
    for (const type of Object.values(SoundType)) {
      result[type] = store.perTypeSoundEnabled[type as SoundTypeStr] ?? true
    }
    return result
  })

  function togglePerType(type: SoundType) {
    const current = perTypeEnabled.value[type]
    store.perTypeSoundEnabled[type as SoundTypeStr] = !current
  }

  // Reactive frequency arrays and durations per sound type
  const soundFreqs = reactive<Record<SoundType, number[]>>({
    [SoundType.WorkEnd]: [...getConfig(SoundType.WorkEnd).frequencies],
    [SoundType.BreakEnd]: [...getConfig(SoundType.BreakEnd).frequencies],
  })
  const soundDurations = reactive<Record<SoundType, number>>({
    [SoundType.WorkEnd]: getConfig(SoundType.WorkEnd).noteDuration,
    [SoundType.BreakEnd]: getConfig(SoundType.BreakEnd).noteDuration,
  })

  function addFrequency(type: SoundType) {
    soundFreqs[type].push(440)
  }

  function removeFrequency(type: SoundType, index: number) {
    soundFreqs[type].splice(index, 1)
  }

  function saveSoundConfig(type: SoundType) {
    const config: SoundConfig = {
      frequencies: [...soundFreqs[type]],
      noteDuration: soundDurations[type],
      label: getSoundLabel(type),
    }
    setConfig(type, config)
  }
</script>
