<template>
  <div>
    <v-btn
      v-if="!open"
      icon
      class="settings-trigger"
      @click="open = true"
    >
      <v-icon>mdi-cog</v-icon>
    </v-btn>

    <v-dialog v-model="open" max-width="500">
      <v-card>
        <v-card-title>
          <span>Settings</span>
          <v-btn icon @click="open = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-tabs v-model="tab" fixed-tabs>
          <v-tab value="appearance">Appearance</v-tab>
          <v-tab value="default-view">Default View</v-tab>
          <v-tab value="sounds">Sounds</v-tab>
        </v-tabs>

        <v-card-text>
          <!-- Appearance Tab -->
          <div v-show="tab === 'appearance'">
            <v-select
              v-model="themePref"
              :items="themeOptions"
              label="Theme"
              hide-details
            />
          </div>

          <!-- Default View Tab -->
          <div v-show="tab === 'default-view'">
            <v-select
              v-model="defaultViewPref"
              :items="defaultViewOptions"
              label="Default View"
              hide-details
            />
          </div>

          <!-- Sounds Tab -->
          <div v-show="tab === 'sounds'">
            <v-switch
              v-model="soundEnabled"
              label="Sounds"
              hide-details
              class="mb-4"
            />

            <div v-for="soundType in soundTypes" :key="soundType" class="sound-section mb-4">
              <h3>{{ getSoundLabel(soundType) }}</h3>

              <v-switch
                v-model="perSoundEnabled[soundType]"
                :label="`Enable ${getSoundLabel(soundType)}`"
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
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import { useUserPreference } from '@/composables/useUserPreference'
  import { type SoundConfig, SoundType, useSound } from '@/components/composables/sound'
  import { loadFromLocalStorage, saveToLocalStorage } from '@/stores/persist'

  const props = defineProps<{
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: boolean]
  }>()

  const open = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value),
  })

  const tab = ref('appearance')

  const themeOptions = [
    { title: 'System', value: 'system' },
    { title: 'Light', value: 'light' },
    { title: 'Dark', value: 'dark' },
  ]

  const theme = useTheme()
  const { value: savedTheme, setValue: saveTheme } = useUserPreference('taskMasterTheme', 'system')

  function applySystemTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.change(isDark ? 'dark' : 'light')
  }

  // On mount, apply saved theme
  if (typeof savedTheme.value === 'string') {
    if (savedTheme.value === 'system') {
      applySystemTheme()
    } else {
      theme.change(savedTheme.value as 'dark' | 'light')
    }
  }

  const themePref = computed({
    get: () => (savedTheme.value as string) ?? 'system',
    set: (val: string) => {
      saveTheme(val)
      if (val === 'system') {
        applySystemTheme()
      } else {
        theme.change(val as 'dark' | 'light')
      }
    },
  })

  const defaultViewOptions = [
    { title: 'List', value: 'list' },
    { title: 'Kanban', value: 'kanban' },
  ]

  const { value: savedDefaultView, setValue: saveDefaultView } = useUserPreference('taskMasterDefaultView', 'kanban')

  const defaultViewPref = computed({
    get: () => (savedDefaultView.value as string) ?? 'kanban',
    set: (val: string) => {
      saveDefaultView(val)
    },
  })

  // --- Sounds Tab ---
  const { soundEnabled, getConfig, setConfig } = useSound()
  const soundTypes = Object.values(SoundType)

  function getSoundLabel(type: SoundType): string {
    return type === SoundType.WorkEnd ? 'Work End' : 'Break End'
  }

  // Per-sound-type on/off toggle
  const PER_TYPE_KEY = 'taskMasterSoundPerType'
  const perSoundEnabled = loadFromLocalStorage<Record<SoundType, boolean>>(
    PER_TYPE_KEY,
    () => ({ [SoundType.WorkEnd]: true, [SoundType.BreakEnd]: true }),
    raw => {
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        const typed = raw as Record<string, unknown>
        return {
          [SoundType.WorkEnd]: typeof typed[SoundType.WorkEnd] === 'boolean' ? typed[SoundType.WorkEnd] as boolean : true,
          [SoundType.BreakEnd]: typeof typed[SoundType.BreakEnd] === 'boolean' ? typed[SoundType.BreakEnd] as boolean : true,
        }
      }
      return { [SoundType.WorkEnd]: true, [SoundType.BreakEnd]: true }
    },
  )

  watch(perSoundEnabled, () => {
    saveToLocalStorage(PER_TYPE_KEY, perSoundEnabled)
  }, { deep: true })

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

<style scoped lang="scss">
.settings-trigger {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}
</style>
