<template>
  <div>
    <v-select
      v-model="themePref"
      :items="themeOptions"
      label="Theme"
      hide-details
    />

    <v-select
      v-model="listViewPref"
      :items="listViewOptions"
      label="List View"
      hide-details
      class="mt-4"
    />

    <v-switch
      v-model="attentionEnabledPref"
      label="Attention Effect"
      hide-details
      class="mt-4"
    />

    <v-slider
      v-model="attentionIdleMinutesPref"
      :min="1"
      :max="30"
      :step="1"
      label="Idle Time (minutes)"
      hide-details
      class="mt-4"
    />

    <v-select
      v-model="attentionEffectVariantPref"
      :items="attentionEffectVariantOptions"
      label="Effect"
      hide-details
      class="mt-4"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useTheme } from 'vuetify'
  import { type ListViewValue, type ThemeValue, useUserPreferencesStore } from '@/stores/userPreferences'

  const store = useUserPreferencesStore()
  const theme = useTheme()

  const themeOptions: { title: string, value: ThemeValue }[] = [
    { title: 'System', value: 'system' },
    { title: 'Light', value: 'light' },
    { title: 'Dark', value: 'dark' },
  ]

  const listViewOptions: { title: string, value: ListViewValue }[] = [
    { title: 'List', value: 'list' },
    { title: 'Kanban', value: 'kanban' },
  ]

  function applySystemTheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.change(isDark ? 'dark' : 'light')
  }

  const themePref = computed({
    get: () => store.theme,
    set: (val: ThemeValue) => {
      store.theme = val
      if (val === 'system') {
        applySystemTheme()
      } else {
        theme.change(val as 'dark' | 'light')
      }
    },
  })

  const listViewPref = computed({
    get: () => store.listView,
    set: (val: ListViewValue) => {
      store.listView = val
    },
  })

  const attentionEffectVariantOptions: { title: string, value: string }[] = [
    { title: 'Rainbow', value: 'rainbow' },
  ]

  const attentionEnabledPref = computed({
    get: () => store.attentionEnabled,
    set: (val: boolean) => {
      store.attentionEnabled = val
    },
  })

  const attentionIdleMinutesPref = computed({
    get: () => store.attentionIdleMinutes,
    set: (val: number) => {
      store.attentionIdleMinutes = val
    },
  })

  const attentionEffectVariantPref = computed({
    get: () => store.attentionEffectVariant,
    set: (val: string) => {
      store.attentionEffectVariant = val
    },
  })
</script>
