<template>
  <v-app>
    <InactivityEffectController />
    <router-view />
  </v-app>
</template>
<script setup lang="ts">
  import InactivityEffectController from '@/components/InactivityEffectController.vue'
</script>
