<script setup>
import { ref, computed, shallowRef, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../stores/auth.js';
import { api } from '../lib/api.js';
import MenuBar from '../components/MenuBar.vue';
import TabBar from '../components/TabBar.vue';
import StatusBar from '../components/StatusBar.vue';
import TodoItem from '../components/TodoItem.vue';

const props = defineProps({ identifier: { type: String, required: true } });
const router = useRouter();

const profile = shallowRef(null);
const todos = shallowRef([]);
const error = ref('');
const notice = ref('');
const focusedIndex = ref(0);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isOwn = computed(() => auth.user.value?.id === profile.value?.id);
const displayName = computed(() => profile.value?.display ?? '...');
const lineCount = computed(() => todos.value.length || 1);
const totalLength = computed(() => {
  let n = 0;
  for (const t of todos.value) n += t.title.length + 1;
  return n;
});

async function load() {
  error.value = '';
  try {
    const data = await api.userTodos(props.identifier);
    profile.value = data.profile;
    todos.value = data.todos;
    // If the route came in with a real username, swap the visible URL to the
    // opaque uuid form so the address bar never shows another user's handle.
    if (!UUID_RE.test(props.identifier) && profile.value?.id) {
      router.replace(`/u/${profile.value.id}`);
    }
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(load);
watch(() => props.identifier, load);

async function clone(t) {
  if (!auth.isAuthed.value) {
    router.push({ path: '/auth', query: { next: `/u/${props.identifier}` } });
    return;
  }
  try {
    await api.cloneTodo(t.id);
    notice.value = `Copied "${t.title}" to your list.`;
    setTimeout(() => (notice.value = ''), 2500);
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<template>
  <div class="np-window">
    <MenuBar />
    <TabBar :filename="`${displayName}-list.txt (read-only)`" />

    <div class="np-editor">
      <div class="np-gutter">
        <div class="np-gutter-line" v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>

      <div class="np-content">
        <div v-if="error"  class="np-error"  style="padding: 4px 14px;">{{ error }}</div>
        <div v-if="notice" class="np-notice" style="padding: 4px 14px;">{{ notice }}</div>

        <div v-if="!error && todos.length === 0" class="np-empty">
          // {{ displayName }} has no public todos yet.
        </div>

        <TodoItem
          v-for="(t, i) in todos"
          :key="t.id"
          v-memo="[t.id]"
          :todo="t"
          :readonly="!isOwn"
          @clone="() => clone(t)"
          @focus="focusedIndex = i + 1"
        />

        <div class="np-toolbar">
          <span style="color: var(--np-gutter-fg);">
            Viewing <b>{{ displayName }}</b>'s public list — read-only.
          </span>
          <span style="flex:1"></span>
          <router-link to="/dashboard" v-if="auth.isAuthed.value" class="np-btn np-btn-sm">
            <span class="np-btn-icon" aria-hidden="true">▤</span>My dashboard
          </router-link>
          <router-link to="/auth" v-else class="np-btn np-btn-sm">
            <span class="np-btn-icon" aria-hidden="true">→</span>Login
          </router-link>
        </div>
      </div>
    </div>

    <StatusBar
      :line="focusedIndex || 1"
      :col="1"
      :length="totalLength"
      :lines="todos.length"
      :mode="`Read-only — ${displayName}`"
    />
  </div>
</template>

<style scoped>
.np-toolbar {
  padding: 16px 14px;
  border-top: 1px dashed #ccc;
  margin-top: 18px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}
</style>
