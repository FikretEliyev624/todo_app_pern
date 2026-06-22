<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../stores/auth.js';
import { api } from '../lib/api.js';
import MenuBar from '../components/MenuBar.vue';
import TabBar from '../components/TabBar.vue';
import StatusBar from '../components/StatusBar.vue';
import TodoItem from '../components/TodoItem.vue';
import NewTodoInput from '../components/NewTodoInput.vue';
import EditTodoDialog from '../components/EditTodoDialog.vue';

const router = useRouter();
const todos = ref([]);
const error = ref('');
const focusedIndex = ref(0);
const editTarget = ref(null);
const urlVisible = ref(false);

const username = computed(() => auth.user.value?.username ?? '');
// Share the opaque uuid form so a shared link never leaks your username.
const profileUrl = computed(() => {
  const id = auth.user.value?.id;
  return id ? `${window.location.origin}/u/${id}` : '';
});
const lineCount = computed(() => todos.value.length + 1);
// Cheap, but `computed` still caches between dependency changes — no
// per-keystroke recomputation thanks to isolating the input below.
const totalLength = computed(() => {
  let n = 0;
  for (const t of todos.value) n += t.title.length + 1;
  return n;
});

onMounted(async () => {
  try { todos.value = await api.myTodos(); }
  catch (e) { error.value = e.message; }
});

// All mutations are optimistic — UI updates immediately and we roll back on
// API failure. This eliminates the perceived "wait" after pressing Enter.

function addTodo(title) {
  const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const temp = {
    id: tempId,
    title,
    is_completed: false,
    created_at: new Date().toISOString(),
    user_id: auth.user.value?.id,
    _pending: true,
  };
  todos.value.push(temp);
  focusedIndex.value = todos.value.length;

  api.createTodo(title)
    .then((created) => {
      const i = todos.value.findIndex((x) => x.id === tempId);
      if (i !== -1) todos.value.splice(i, 1, created);
    })
    .catch((e) => {
      todos.value = todos.value.filter((x) => x.id !== tempId);
      error.value = e.message;
    });
}

function onToggle(t, checked) {
  const before = t.is_completed;
  t.is_completed = checked;
  api.updateTodo(t.id, { is_completed: checked }).catch((e) => {
    t.is_completed = before;
    error.value = e.message;
  });
}

function onUpdate(t, patch) {
  const before = { title: t.title, is_completed: t.is_completed };
  if (patch.title !== undefined) t.title = patch.title;
  if (patch.is_completed !== undefined) t.is_completed = patch.is_completed;
  api.updateTodo(t.id, patch).catch((e) => {
    Object.assign(t, before);
    error.value = e.message;
  });
}

function onDelete(t) {
  if (!confirm(`Delete "${t.title}"?`)) return;
  const idx = todos.value.findIndex((x) => x.id === t.id);
  if (idx === -1) return;
  const [removed] = todos.value.splice(idx, 1);
  api.deleteTodo(t.id).catch((e) => {
    todos.value.splice(idx, 0, removed);
    error.value = e.message;
  });
}

function openEdit(t) {
  editTarget.value = t;
}

function saveEdit(newTitle) {
  const t = editTarget.value;
  editTarget.value = null;
  if (t) onUpdate(t, { title: newTitle });
}

function logout() {
  auth.clear();
  router.replace('/auth');
}

function copyProfileUrl() {
  navigator.clipboard?.writeText(profileUrl.value);
}
</script>

<template>
  <div class="np-window">
    <MenuBar />
    <TabBar :filename="`${username || 'todo'}-list.txt`" />

    <div class="np-editor">
      <div class="np-gutter">
        <div class="np-gutter-line" v-for="n in lineCount" :key="n">{{ n }}</div>
      </div>

      <div class="np-content">
        <div v-if="error" class="np-error" style="padding: 4px 14px;">
          {{ error }}
          <button class="np-btn np-btn-sm" @click="error = ''">x</button>
        </div>

        <div v-if="todos.length === 0" class="np-empty">
          // No todos yet. Type below and press Enter to add your first line.
        </div>

        <TodoItem
          v-for="(t, i) in todos"
          :key="t.id"
          v-memo="[t.title, t.is_completed]"
          :todo="t"
          @toggle="(v) => onToggle(t, v)"
          @edit="() => openEdit(t)"
          @delete="() => onDelete(t)"
          @focus="focusedIndex = i + 1"
        />

        <NewTodoInput @add="addTodo" />

        <div class="np-toolbar">
          <span style="color: var(--np-gutter-fg);">Your public URL:</span>
          <code class="np-url">{{ urlVisible ? profileUrl : '••••••••••••••••' }}</code>
          <button class="np-btn np-btn-sm" @click="urlVisible = !urlVisible">
            <span class="np-btn-icon" aria-hidden="true">{{ urlVisible ? '🞨' : '◉' }}</span>
            {{ urlVisible ? 'Hide' : 'Show' }}
          </button>
          <button v-if="urlVisible" class="np-btn np-btn-sm" @click="copyProfileUrl">
            <span class="np-btn-icon" aria-hidden="true">⎘</span>Copy URL
          </button>
          <span style="flex:1"></span>
          <button class="np-btn np-btn-sm" @click="logout">
            <span class="np-btn-icon" aria-hidden="true">⏻</span>Logout
          </button>
        </div>
      </div>
    </div>

    <StatusBar
      :line="focusedIndex || 1"
      :col="1"
      :length="totalLength"
      :lines="lineCount"
      :mode="`Normal text file — ${username}`"
    />

    <EditTodoDialog
      :show="!!editTarget"
      :initial-title="editTarget?.title ?? ''"
      @save="saveEdit"
      @cancel="editTarget = null"
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
.np-url {
  background: #f0f0f0;
  padding: 3px 8px;
  font-size: 13px;
}
</style>
