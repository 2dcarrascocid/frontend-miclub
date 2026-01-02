<template>
  <div class="landing-page">
    <!-- Public Navigation -->
    <nav class="landing-nav">
      <div class="container nav-content">
        <div class="nav-brand">
      <img
        :src="logo"
        alt="Fair Play Chile Logo"
        style="height: 48px; width: auto;"
      />
        </div>
        <div class="nav-actions">
          <router-link v-if="!isAuthenticated" to="/login" class="btn btn-outline btn-sm">
            Iniciar Sesión
          </router-link>
          <router-link v-else to="/dashboard" class="btn btn-primary btn-sm">
            Ir al Dashboard
          </router-link>
        </div>
      </div>
    </nav>

    <div class="container">
      <!-- Hero Section -->
      <header class="hero-section">
        <h1 class="hero-title">Gestiona tu club deportivo <span class="highlight">como un profesional</span></h1>
        <p class="hero-subtitle">
          La plataforma todo en uno para administración de equipos, jugadores y finanzas.
        </p>
      </header>

      <!-- Pricing Section -->
      <section class="pricing-section">
        <h2 class="section-title">Nuestros Planes</h2>
        <p class="section-subtitle">Elige el plan perfecto para tu equipo</p>

        <div class="pricing-grid">
          <div 
            v-for="plan in plans" 
            :key="plan.id" 
            class="pricing-card"
            :class="{ 'featured': plan.tier === 'pro' }"
          >
            <div class="card-header-price">
              <h3 class="plan-name">{{ plan.nombre }}</h3>
              <div class="plan-price">
                <span class="currency" v-if="plan.precio_mensual > 0">$</span>
                <span class="amount">{{ plan.precio_mensual > 0 ? formatPrice(plan.precio_mensual) : 'GRATIS' }}</span>
                <span class="period" v-if="plan.precio_mensual > 0">/mes</span>
              </div>
              <p class="plan-desc">{{ plan.descripcion }}</p>
            </div>

            <div class="card-body-features">
              <ul class="features-list">
                <li v-if="plan.limites.max_jugadores">
                  <span class="check">✓</span> Hasta {{ plan.limites.max_jugadores }} jugadores
                </li>
                <li v-else>
                  <span class="check">✓</span> Jugadores ilimitados
                </li>
                
                <li>
                  <span class="check">✓</span> {{ plan.limites.max_admins }} Administrador{{ plan.limites.max_admins > 1 ? 'es' : '' }}
                </li>

                <li :class="{ 'disabled': !plan.limites.permite_finanzas }">
                  <span class="check">{{ plan.limites.permite_finanzas ? '✓' : '×' }}</span> Gestión Financiera
                </li>

                <li :class="{ 'disabled': !plan.limites.permite_reportes }">
                  <span class="check">{{ plan.limites.permite_reportes ? '✓' : '×' }}</span> Reportes Avanzados
                </li>
                
                <li :class="{ 'disabled': !plan.limites.permite_notificaciones_email }">
                  <span class="check">{{ plan.limites.permite_notificaciones_email ? '✓' : '×' }}</span> Notificaciones Email
                </li>
              </ul>
            </div>

            <div class="card-footer-action">
              <button 
                v-if="plan.precio_mensual === 0" 
                class="btn btn-primary full-width"
                @click="handlePlanSelection(plan)"
              >
                Comenzar Gratis
              </button>
              <button 
                v-else 
                class="btn btn-outline full-width"
                @click="handlePlanSelection(plan)"
              >
                Suscribirse
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import plansData from '../../planes.json';
import logo from "../../src/assets/fplay.png";

const router = useRouter();
const authStore = useAuthStore();

const plans = plansData;
const isAuthenticated = computed(() => authStore.isAuthenticated.value);

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CL').format(value);
};

const scrollToPlans = () => {
  const plansSection = document.querySelector('.pricing-section');
  if (plansSection) {
    plansSection.scrollIntoView({ behavior: 'smooth' });
  }
};

const handlePlanSelection = (plan) => {
  if (isAuthenticated.value) {
    // If already logged in, maybe redirect to membership or upgrade page (placeholder)
    // For now, let's just go to dashboard if they click free, or same external link if paid
    if (plan.precio_mensual === 0) {
        router.push('/dashboard');
    } else {
        window.location.href = 'https://www.webpay.cl'; // Placeholder external link
    }
    return;
  }

  if (plan.precio_mensual === 0) {
    // Free plan -> Register
    router.push('/register');
  } else {
    // Paid plan -> External Payment
    // TODO: Implement actual payment flow integration
    window.location.href = 'https://www.webpay.cl'; 
  }
};
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: var(--spacing-2xl);
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
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-actions {
  display: flex;
  gap: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 6rem 1rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: var(--spacing-lg);
  line-height: 1.2;
}

.hero-title .highlight {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

/* Pricing Section */
.pricing-section {
  padding: var(--spacing-xl) 0;
  text-align: center;
}

.section-title {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
}

.section-subtitle {
  color: var(--text-secondary);
  margin-bottom: 3rem;
  font-size: 1.1rem;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.pricing-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.pricing-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}

.pricing-card.featured {
  border-color: var(--primary-light);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
}

.pricing-card.featured::before {
  content: 'POPULAR';
  position: absolute;
  top: 12px;
  right: -30px;
  background: var(--primary-gradient);
  color: white;
  padding: 4px 40px;
  transform: rotate(45deg);
  font-size: 0.75rem;
  font-weight: bold;
}

.card-header-price {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 2rem;
}

.plan-name {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.plan-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: 1rem;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  margin-right: 2px;
}

.amount {
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-primary);
}

.period {
  color: var(--text-muted);
  font-size: 1rem;
  margin-left: 4px;
}

.plan-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.card-body-features {
  flex: 1;
  margin-bottom: 2rem;
}

.features-list {
  list-style: none;
  padding: 0;
  text-align: left;
}

.features-list li {
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.features-list li.disabled {
  color: var(--text-muted);
  text-decoration: line-through;
  opacity: 0.7;
}

.check {
  color: var(--accent-green);
  font-weight: bold;
}

.disabled .check {
  color: var(--text-muted);
}

.card-footer-action {
  margin-top: auto;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
}
</style>