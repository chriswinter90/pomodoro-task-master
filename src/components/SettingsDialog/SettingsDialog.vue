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
          <v-tab value="sounds">Sounds</v-tab>
        </v-tabs>

        <v-card-text>
          <AppearanceTab v-if="tab === 'appearance'" />
          <SoundTab v-if="tab === 'sounds'" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import AppearanceTab from './AppearanceTab.vue'
  import SoundTab from './SoundTab.vue'

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
</script>

<style scoped lang="scss">
</style>
