<template>
  <div :class="['bg-effect', `bg-effect-${variant}`]" />
</template>

<script setup lang="ts">
  import type { AttentionEffectVariant } from '@/stores/userPreferences.ts'

  defineProps<{
    variant?: AttentionEffectVariant
  }>()
</script>

<style scoped>
.bg-effect {
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.5;
}

.bg-effect-rainbow {
  background: linear-gradient(
    135deg,
    #ff6b6b,
    #ffa94d,
    #ffd43b,
    #69db7c,
    #4dabf7,
    #9775fa,
    #f06595
  );
  background-size: 400% 400%;
  animation: rainbow-cycle 6s ease infinite;
}

</style>

<style>
@keyframes rainbow-cycle {
  0% {
    background-position: 0 0;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
