<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { auth } from '../stores/auth.js';
import { api } from '../lib/api.js';
import MenuBar from '../components/MenuBar.vue';
import TabBar from '../components/TabBar.vue';
import StatusBar from '../components/StatusBar.vue';

const router = useRouter();
const route = useRoute();

const mode = ref('login'); // 'login' | 'signup'
const form = reactive({ email: '', password: '', username: '' });
const error = ref('');
const notice = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  notice.value = '';
  busy.value = true;
  try {
    if (mode.value === 'signup') {
      const res = await api.signup(form);
      if (!res.session) {
        notice.value = 'Account created. Check your email to confirm, then log in.';
        mode.value = 'login';
        return;
      }
      auth.setSession(res);
    } else {
      const res = await api.login({ email: form.email, password: form.password });
      auth.setSession(res);
    }
    const next = typeof route.query.next === 'string' ? route.query.next : '/dashboard';
    router.replace(next);
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="np-window">
    <MenuBar />
    <TabBar filename="auth.txt" />

    <div class="np-editor">
      <div class="np-gutter">
        <div class="np-gutter-line" v-for="n in 6" :key="n">{{ n }}</div>
      </div>

      <div class="np-content">
        <div class="np-dialog-wrap">
          <div class="np-dialog">
            <div class="np-dialog-title">
              <span>{{ mode === 'login' ? 'Login' : 'Sign Up' }} — Notepad++</span>
              <span>_ □ ×</span>
            </div>
            <div class="np-dialog-body">
              <div class="np-tabs-inline">
                <button :class="{ active: mode === 'login' }"  @click="mode = 'login'">Login</button>
                <button :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Sign Up</button>
              </div>

              <form @submit.prevent="submit">
                <div class="np-field" v-if="mode === 'signup'">
                  <label for="username">Username (used in /u/&lt;username&gt;)</label>
                  <input id="username" v-model="form.username" autocomplete="username" required />
                </div>

                <div class="np-field">
                  <label for="email">Email</label>
                  <input id="email" type="email" v-model="form.email" autocomplete="email" required />
                </div>

                <div class="np-field">
                  <label for="password">Password</label>
                  <input id="password" type="password" v-model="form.password" autocomplete="current-password" required minlength="6" />
                </div>

                <div v-if="error"  class="np-error">{{ error }}</div>
                <div v-if="notice" class="np-notice">{{ notice }}</div>

                <div class="np-dialog-actions">
                  <button type="button" class="np-btn" @click="form.email = form.password = form.username = ''">
                    <span class="np-btn-icon" aria-hidden="true">↺</span>Reset
                  </button>
                  <button type="submit" class="np-btn primary" :disabled="busy">
                    <span class="np-btn-icon" aria-hidden="true">{{ mode === 'login' ? '→' : '✓' }}</span>
                    {{ busy ? '...' : (mode === 'login' ? 'Login' : 'Create account') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <StatusBar :line="1" :col="1" :length="0" :lines="0" mode="Dialog" />
  </div>
</template>
