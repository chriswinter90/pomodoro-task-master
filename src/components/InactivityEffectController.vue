<template>
  <BackgroundEffects
    v-if="attentionEnabled && isActive"
    :variant="attentionEffectVariant"
  />
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  import { useUserPreferencesStore } from '@/stores/userPreferences'
  import { useInactivityStore } from '@/stores/inactivity'
  import BackgroundEffects from './BackgroundEffects.vue'

  const userPrefsStore = useUserPreferencesStore()
  const inactivityStore = useInactivityStore()

  const attentionEnabled = computed(() => userPrefsStore.attentionEnabled)
  const attentionEffectVariant = computed(() => userPrefsStore.attentionEffectVariant)
  const isActive = computed(() => inactivityStore.isActive)
</script>
