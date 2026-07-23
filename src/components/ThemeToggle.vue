<template>
  <v-switch
    v-model="isDark"
    :label="isDark ? '' : ''"
    hide-details
    class="theme-toggle"
    @update:model-value="onToggle"
  >
    <template v-slot:prepend>
      <v-icon>{{ isDark ? 'mdi-moon-waning-crescent' : 'mdi-weather-sunny' }}</v-icon>
    </template>
    <template v-slot:append>
      <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
    </template>
  </v-switch>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useUserPreference } from '@/composables/useUserPreference'

const { theme } = useTheme()
const { value: savedTheme, setValue: saveTheme } = useUserPreference('theme-preference', 'system')

// On first load, if no saved preference, let Vuetify's system default apply.
// Otherwise, apply the saved theme.
if (savedTheme !== 'system') {
  theme.global.name = savedTheme
}

const isDark = computed({
  get: () => theme.global.name === 'dark',
  set: (val: boolean) => {
    const newTheme = val ? 'dark' : 'light'
    theme.global.name = newTheme
    saveTheme(newTheme)
  },
})

function onToggle() {
  // Model update handles persistence via the computed setter
}
</script>

<style scoped lang="scss">
.theme-toggle {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
}
</style>
