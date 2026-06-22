<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['add']);
const title = ref('');
const canAdd = computed(() => title.value.trim().length > 0);

function add() {
  if (!canAdd.value) return;
  emit('add', title.value.trim());
  title.value = '';
}
</script>

<template>
  <div class="np-new-line">
    <span class="np-prompt">&gt;</span>
    <input
      v-model.trim="title"
      placeholder="add a new task and press Enter..."
      @keydown.enter.prevent="add"
    />
    <button class="np-btn np-btn-sm primary" :disabled="!canAdd" @click="add">
      <span class="np-btn-icon" aria-hidden="true">+</span>Add
    </button>
  </div>
</template>
