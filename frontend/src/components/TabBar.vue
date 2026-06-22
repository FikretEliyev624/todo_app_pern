<script setup>
defineProps({
  filename: { type: String, default: 'todo-list.txt' },
});
</script>

<template>
  <div class="np-tabs">
    <div class="np-tab active">
      <span class="np-tab-dot" />
      <span>{{ filename }}</span>
    </div>
  </div>
</template>
