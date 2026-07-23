<template>
  <v-switch
    v-model="isDark"
    :label="isDark ? '' : ''"
    hide-details
    class="theme-toggle"
  >
    <template #prepend>
      <v-icon>{{ isDark ? 'mdi-moon-waning-crescent' : 'mdi-weather-sunny' }}</v-icon>
    </template>
    <template #append>
      <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
    </template>
  </v-switch>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useTheme } from 'vuetify'
  import { useUserPreference } from '@/composables/useUserPreference'

  const theme = useTheme()
  const { value: savedTheme, setValue: saveTheme } = useUserPreference('theme-preference', 'system')

  // On the first load, if no saved preference, let Vuetify's system default apply.
  // Otherwise, apply the saved theme.
  if (savedTheme.value !== 'system') {
    theme.change(savedTheme.value)
  }

  const isDark = computed({
    get: () => theme.global.name.value === 'dark',
    set: (val: boolean) => {
      const newTheme: 'dark' | 'light' = val ? 'dark' : 'light'
      theme.change(newTheme)
      saveTheme(newTheme)
    },
  })

</script>

<style scoped lang="scss">
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}
</style>
