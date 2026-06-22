import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../stores/auth.js';

const routes = [
  { path: '/',           redirect: () => (auth.isAuthed.value ? '/dashboard' : '/auth') },
  { path: '/auth',       component: () => import('../views/AuthView.vue'),            meta: { guest: true } },
  { path: '/dashboard',  component: () => import('../views/DashboardView.vue'),       meta: { authed: true } },
  { path: '/u/:identifier', component: () => import('../views/PublicProfileView.vue'), props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  if (to.meta.authed && !auth.isAuthed.value) return { path: '/auth', query: { next: to.fullPath } };
  if (to.meta.guest  &&  auth.isAuthed.value) return { path: '/dashboard' };
  return true;
});

export default router;
