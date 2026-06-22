<script setup>
defineProps({
  todo: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle', 'edit', 'delete', 'clone', 'focus']);
</script>

<template>
  <div
    class="np-line"
    :class="{ completed: todo.is_completed }"
    @click="emit('focus')"
  >
    <input
      type="checkbox"
      class="np-check"
      :checked="todo.is_completed"
      :disabled="readonly"
      @change="(e) => emit('toggle', e.target.checked)"
    />

    <span class="np-title" :title="todo.title">{{ todo.title }}</span>

    <span class="np-actions">
      <template v-if="!readonly">
        <button class="np-btn np-btn-sm" @click.stop="emit('edit')">
          <span class="np-btn-icon" aria-hidden="true">✎</span>Edit
        </button>
        <button class="np-btn np-btn-sm danger" @click.stop="emit('delete')">
          <span class="np-btn-icon" aria-hidden="true">✕</span>Del
        </button>
      </template>
      <button v-else class="np-btn np-btn-sm primary" @click.stop="emit('clone')">
        <span class="np-btn-icon" aria-hidden="true">⎘</span>Copy to my list
      </button>
    </span>
  </div>
</template>
