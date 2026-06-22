import { ref, computed } from 'vue';

const SESSION_KEY = 'npp.session';
const USER_KEY    = 'npp.user';

const session = ref(null);
const user    = ref(null);
const ready   = ref(false);

function persist() {
  if (session.value) localStorage.setItem(SESSION_KEY, JSON.stringify(session.value));
  else localStorage.removeItem(SESSION_KEY);
  if (user.value) localStorage.setItem(USER_KEY, JSON.stringify(user.value));
  else localStorage.removeItem(USER_KEY);
}

async function restore() {
  try {
    const rawS = localStorage.getItem(SESSION_KEY);
    const rawU = localStorage.getItem(USER_KEY);
    if (rawS) session.value = JSON.parse(rawS);
    if (rawU) user.value    = JSON.parse(rawU);
  } catch {
    session.value = null;
    user.value = null;
  } finally {
    ready.value = true;
  }
}

function setSession({ user: u, session: s }) {
  user.value    = u ?? null;
  session.value = s ?? null;
  persist();
}

function clear() {
  user.value = null;
  session.value = null;
  persist();
}

export const auth = {
  session,
  user,
  ready,
  isAuthed: computed(() => !!session.value?.access_token && !!user.value),
  restore,
  setSession,
  clear,
};
