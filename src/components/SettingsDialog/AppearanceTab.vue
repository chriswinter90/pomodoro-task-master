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
</script>
