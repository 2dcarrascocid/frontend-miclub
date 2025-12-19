<template>
  <div class="error-page">
    <div class="container error-container">
      <div class="card error-card">
        <div class="error-badge">
          <span class="error-code">{{ resolvedStatusCode }}</span>
          <span class="error-label">{{ resolvedLabel }}</span>
        </div>

        <div class="error-hero text-center">
          <div class="yellow-card-wrap" aria-hidden="true">
            <div class="yellow-card">
              <div class="yellow-card-shine"></div>
              <div class="yellow-card-stripe"></div>
              <div class="yellow-card-icon">{{ resolvedIcon }}</div>
            </div>
          </div>
          <h1 class="error-title">{{ resolvedTitle }}</h1>
          <p class="error-message">{{ resolvedMessage }}</p>
        </div>

        <div class="error-actions">
          <button class="btn btn-secondary" @click="goBack">⬅ Volver</button>
          <button class="btn btn-primary" @click="goPrimary">
            {{ primaryCta }}
          </button>
          <router-link class="btn btn-outline" to="/dashboard">Dashboard</router-link>
        </div>

        <div class="error-footer text-center mt-3">
          <div class="text-muted">{{ productLine }}</div>
        </div>
      </div>

      <div class="bg-orbs" aria-hidden="true">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  statusCode: { type: [Number, String], default: undefined },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const resolvedStatusCode = computed(() => {
  const fromProps = Number(props.statusCode);
  if (Number.isFinite(fromProps) && fromProps > 0) return fromProps;

  const fromQuery = Number(route.query.code);
  if (Number.isFinite(fromQuery) && fromQuery > 0) return fromQuery;

  return route.name === 'NotFound' ? 404 : 500;
});

const resolvedTitle = computed(() => {
  if (props.title) return props.title;
  if (typeof route.query.title === 'string' && route.query.title.trim()) return route.query.title.trim();
  return resolvedStatusCode.value === 404 ? 'Página no encontrada' : 'Algo salió mal';
});

const resolvedMessage = computed(() => {
  if (props.message) return props.message;
  if (typeof route.query.message === 'string' && route.query.message.trim()) return route.query.message.trim();
  return resolvedStatusCode.value === 404
    ? 'La ruta que intentaste abrir no existe o fue movida.'
    : 'Ocurrió un error inesperado. Intenta nuevamente.';
});

const resolvedLabel = computed(() => (resolvedStatusCode.value === 404 ? 'Not Found' : 'Error'));
const resolvedIcon = computed(() => (resolvedStatusCode.value === 404 ? '🧭' : '⚠️'));

const primaryCta = computed(() => (authStore.isAuthenticated.value ? 'Ir al Dashboard' : 'Ir al Login'));

const productLine = computed(() => 'Fairplay Club · Producto de Fairplay Chile');

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push('/dashboard');
};

const goPrimary = () => {
  router.push(authStore.isAuthenticated.value ? '/dashboard' : '/login');
};
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  position: relative;
  overflow: hidden;
}

.error-container {
  position: relative;
  width: 100%;
  max-width: 900px;
}

.error-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.error-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(800px circle at 20% 10%, rgba(102, 126, 234, 0.25), transparent 55%),
    radial-gradient(700px circle at 80% 30%, rgba(16, 185, 129, 0.15), transparent 55%),
    radial-gradient(600px circle at 40% 90%, rgba(245, 158, 11, 0.12), transparent 55%);
  pointer-events: none;
}

.error-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
}

.error-code {
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--primary-light);
}

.error-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.error-hero {
  margin-top: var(--spacing-xl);
}

.yellow-card-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.yellow-card {
  width: 120px;
  height: 170px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 55%, #d97706 100%);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 0 26px rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.18);
  position: relative;
  transform: rotate(-10deg);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.yellow-card::after {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.35);
  opacity: 0.55;
}

.yellow-card:hover {
  transform: rotate(-7deg) translateY(-2px);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.55), 0 0 32px rgba(245, 158, 11, 0.22);
}

.yellow-card-shine {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: radial-gradient(120px circle at 20% 18%, rgba(255, 255, 255, 0.65), transparent 55%),
    radial-gradient(140px circle at 80% 30%, rgba(255, 255, 255, 0.18), transparent 60%);
  opacity: 0.55;
  pointer-events: none;
}

.yellow-card-stripe {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 18px;
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  opacity: 0.8;
}

.yellow-card-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.25rem;
  color: rgba(15, 23, 42, 0.65);
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.25));
}

.error-title {
  font-size: 2.25rem;
  margin-bottom: var(--spacing-sm);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-message {
  max-width: 60ch;
  margin: 0 auto;
  color: var(--text-secondary);
}

.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-xl);
}

.error-footer {
  position: relative;
  padding-top: var(--spacing-lg);
}

.bg-orbs {
  position: absolute;
  inset: -50px;
  pointer-events: none;
  z-index: -1;
}

.orb {
  position: absolute;
  border-radius: 50%;
  background: var(--primary-gradient);
  opacity: 0.06;
  filter: blur(0px);
  animation: float 18s ease-in-out infinite;
}

.orb-1 {
  width: 420px;
  height: 420px;
  top: -120px;
  right: -140px;
  animation-delay: 0s;
}

.orb-2 {
  width: 320px;
  height: 320px;
  bottom: -160px;
  left: -140px;
  opacity: 0.05;
  animation-delay: 6s;
}

.orb-3 {
  width: 240px;
  height: 240px;
  top: 55%;
  left: 55%;
  transform: translate(-50%, -50%);
  opacity: 0.04;
  animation-delay: 12s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(24px, -24px) scale(1.08);
  }
  66% {
    transform: translate(-18px, 22px) scale(0.98);
  }
}
</style>
