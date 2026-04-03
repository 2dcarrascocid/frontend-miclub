<template>
  <div class="invite-page">
    <div class="invite-card">
      <!-- Loading -->
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>Verificando invitación...</p>
      </div>

      <!-- Inválida / Vencida -->
      <div v-else-if="invalid" class="state">
        <span class="state-icon">❌</span>
        <h2>Invitación no válida</h2>
        <p>{{ invalidMessage }}</p>
        <router-link to="/login" class="btn btn-primary">Ir al inicio</router-link>
      </div>

      <!-- Válida — mostrar info del club -->
      <div v-else-if="invitacion" class="state">
        <span class="state-icon">🏆</span>
        <h2>Invitación a <strong>{{ invitacion.club?.nombre }}</strong></h2>
        <p class="invite-email">Para: <strong>{{ invitacion.email }}</strong></p>
        <p class="invite-expiry">Válida hasta: {{ formatDate(invitacion.expires_at) }}</p>

        <!-- No autenticado -->
        <div v-if="!isAuthenticated" class="auth-notice">
          <p>Necesitas iniciar sesión o registrarte para aceptar la invitación.</p>
          <div class="auth-actions">
            <router-link :to="`/login?redirect=/invitacion/${token}`" class="btn btn-primary">
              Iniciar Sesión
            </router-link>
            <router-link :to="`/register?redirect=/invitacion/${token}`" class="btn btn-outline">
              Registrarse
            </router-link>
          </div>
        </div>

        <!-- Autenticado -->
        <div v-else class="accept-area">
          <button
            class="btn btn-primary btn-lg"
            :disabled="accepting"
            @click="handleAceptar"
          >
            {{ accepting ? 'Aceptando...' : 'Aceptar Invitación' }}
          </button>
          <p v-if="acceptError" class="error-msg">{{ acceptError }}</p>
        </div>
      </div>

      <!-- Aceptada con éxito -->
      <div v-else-if="accepted" class="state">
        <span class="state-icon">✅</span>
        <h2>¡Invitación aceptada!</h2>
        <p>Ahora tienes acceso para administrar el club.</p>
        <router-link to="/clubs" class="btn btn-primary">Ir a Mi Club</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { invitacionesAPI } from '../api';

const route = useRoute();
const authStore = useAuthStore();

const token = route.params.token;
const isAuthenticated = authStore.isAuthenticated;

const loading   = ref(true);
const invalid   = ref(false);
const accepting = ref(false);
const accepted  = ref(false);
const invitacion   = ref(null);
const invalidMessage = ref('');
const acceptError    = ref('');

onMounted(async () => {
  try {
    const res = await invitacionesAPI.verificar(token);
    invitacion.value = res.data;
  } catch (err) {
    invalid.value = true;
    invalidMessage.value = err.response?.data?.message || 'Esta invitación no existe o ya no está disponible.';
  } finally {
    loading.value = false;
  }
});

const handleAceptar = async () => {
  accepting.value = true;
  acceptError.value = '';
  try {
    await invitacionesAPI.aceptar(token);
    invitacion.value = null;
    accepted.value = true;
  } catch (err) {
    acceptError.value = err.response?.data?.message || 'Error al aceptar la invitación.';
  } finally {
    accepting.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
};
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 1rem;
}

.invite-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-2xl);
}

.state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.state-icon {
  font-size: 3rem;
}

.state h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.state p {
  color: var(--text-secondary);
  margin: 0;
}

.invite-email {
  font-size: 0.95rem;
}

.invite-expiry {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.auth-notice {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  width: 100%;
}

.auth-notice p {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.auth-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.accept-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.btn-lg {
  padding: 0.75rem 2rem;
  font-size: 1rem;
}

.error-msg {
  color: var(--accent-red);
  font-size: 0.875rem;
}
</style>
