<script setup>
// Static — render once and never diff again.
const items = ['File', 'Edit', 'Search', 'View', 'Encoding', 'Language', 'Settings', 'Tools', 'Macro', 'Run', 'Plugins', 'Window', '?'];
</script>

<template>
  <nav class="np-menu" v-once>
    <span v-for="m in items" :key="m" class="np-menu-item">{{ m }}</span>
  </nav>
</template>
