<template>
  <div :class="['bg-effect', `bg-effect-${variant}`]" />
</template>

<script setup lang="ts">
  export type EffectVariant = 'rainbow'

  defineProps<{
    variant?: EffectVariant
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
  z-index: -1;
}

.bg-effect-rainbow {
  background: linear-gradient(
    120deg,
    #ff6b6b,
    #ffa94d,
    #ffd43b,
    #69db7c,
    #4dabf7,
    #9775fa,
    #f06595
  );
  background-size: 400% 400%;
  animation: rainbow-cycle 12s ease infinite;
}

</style>

<style>
@keyframes rainbow-cycle {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
