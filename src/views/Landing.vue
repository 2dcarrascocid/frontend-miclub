<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="landing-nav">
      <div class="container nav-content">
        <div class="nav-brand">
          <img :src="logo" alt="Fair Play Chile Logo" style="height: 48px; width: auto;" />
        </div>
      </div>
    </nav>

    <div class="container">
      <!-- Hero Section -->
      <header class="hero-section">
        <h1 class="hero-title">
          Gestiona tu club deportivo <span class="highlight">como un profesional</span>
        </h1>
        <p class="hero-subtitle">
          La plataforma todo en uno para administración de equipos, jugadores y finanzas.
        </p>

        <div v-if="!isAuthenticated" class="hero-actions">
          <router-link to="/register" class="btn btn-primary btn-lg">
            Registrarse Gratis
          </router-link>
          <router-link to="/login" class="btn btn-outline btn-lg">
            Iniciar Sesión
          </router-link>
        </div>
        <div v-else class="hero-actions">
          <router-link to="/dashboard" class="btn btn-primary btn-lg">
            Ir al Dashboard
          </router-link>
        </div>
      </header>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import logo from '../../src/assets/fplay.png';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated.value);
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* Navigation */
.landing-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 0;
  z-index: 10;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.nav-actions {
  display: flex;
  gap: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Hero */
.hero-section {
  text-align: center;
  padding: 8rem 1rem 4rem;
  max-width: 700px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.25rem;
  line-height: 1.2;
}

.hero-title .highlight {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 0.85rem 2rem;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
}
</style>
