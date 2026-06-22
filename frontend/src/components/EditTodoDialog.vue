<script setup>
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  initialTitle: { type: String, default: '' },
});

const emit = defineEmits(['save', 'cancel']);

const draft = ref('');
const inputRef = ref(null);

const canSave = computed(() => {
  const t = draft.value.trim();
  return t.length > 0 && t !== props.initialTitle;
});

watch(() => props.show, async (open) => {
  if (open) {
    draft.value = props.initialTitle;
    await nextTick();
    inputRef.value?.focus();
    inputRef.value?.select();
  }
});

function save() {
  if (!canSave.value) return;
  emit('save', draft.value.trim());
}
</script>

<template>
  <div v-if="show" class="np-modal-backdrop" @click.self="emit('cancel')">
    <div class="np-dialog" role="dialog" aria-modal="true">
      <div class="np-dialog-title">
        <span>Edit Line — Notepad++</span>
        <span class="np-dialog-close" @click="emit('cancel')">×</span>
      </div>
      <div class="np-dialog-body">
        <div class="np-field">
          <label for="edit-line">Line text:</label>
          <input
            id="edit-line"
            ref="inputRef"
            v-model="draft"
            maxlength="500"
            @keydown.enter.prevent="save"
            @keydown.escape.prevent="emit('cancel')"
          />
        </div>

        <div class="np-dialog-actions">
          <button class="np-btn" @click="emit('cancel')">
            <span class="np-btn-icon" aria-hidden="true">×</span>Cancel
          </button>
          <button class="np-btn primary" :disabled="!canSave" @click="save">
            <span class="np-btn-icon" aria-hidden="true">✓</span>Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
