import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import { auth } from './stores/auth.js';
import './assets/notepad.css';

auth.restore();

createApp(App).use(router).mount('#app');
