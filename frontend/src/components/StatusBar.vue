<script setup>
const props = defineProps({
  line: { type: Number, default: 1 },
  col:  { type: Number, default: 1 },
  length: { type: Number, default: 0 },
  lines:  { type: Number, default: 0 },
  mode:   { type: String, default: 'Normal text file' },
});
</script>

<template>
  <footer class="np-status">
    <div class="np-status-cell flex">{{ mode }}</div>
    <div class="np-status-cell">length : {{ length }}    lines : {{ lines }}</div>
    <div class="np-status-cell">Ln : {{ line }}    Col : {{ col }}</div>
    <div class="np-status-cell">Windows (CR LF)</div>
    <div class="np-status-cell">UTF-8</div>
    <div class="np-status-cell">INS</div>
  </footer>
</template>
