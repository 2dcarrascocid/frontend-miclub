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

      <!-- Aceptada con éxito -->
      <div v-else-if="accepted" class="state">
        <span class="state-icon">✅</span>
        <h2>¡Bienvenido a {{ clubNombre }}!</h2>
        <p>Tu cuenta fue creada y ya tienes acceso al club.</p>
        <router-link to="/clubs" class="btn btn-primary">Ir a Mi Club</router-link>
      </div>

      <!-- Invitación válida -->
      <div v-else-if="invitacion">
        <div class="invite-header">
          <span class="state-icon">🏆</span>
          <h2>Invitación a <strong>{{ invitacion.club?.nombre }}</strong></h2>
          <p class="invite-expiry">Válida hasta {{ formatDate(invitacion.expires_at) }}</p>
        </div>

        <!-- CASO A: Usuario ya autenticado → aceptar directo -->
        <div v-if="isAuthenticated" class="accept-area">
          <button class="btn btn-primary btn-lg" :disabled="accepting" @click="handleAceptar">
            {{ accepting ? 'Aceptando...' : 'Aceptar Invitación' }}
          </button>
          <p v-if="acceptError" class="error-msg">{{ acceptError }}</p>
        </div>

        <!-- CASO B: Email sin cuenta → formulario de registro con email bloqueado -->
        <form v-else-if="!invitacion.usuario_existe" class="register-form" @submit.prevent="handleRegistrar">
          <p class="form-intro">Crea tu cuenta para acceder al club:</p>

          <!-- Email bloqueado — viene de la invitación -->
          <div class="field">
            <label>Correo electrónico</label>
            <div class="locked-email">
              <span>{{ invitacion.email }}</span>
              <span class="lock-badge">🔒 confirmado</span>
            </div>
          </div>

          <div class="field">
            <label for="nombre">Nombre</label>
            <input id="nombre" v-model="form.nombre" type="text" placeholder="Tu nombre" required autocomplete="given-name" />
          </div>

          <div class="field">
            <label for="apellido">Apellido</label>
            <input id="apellido" v-model="form.apellido" type="text" placeholder="Tu apellido" autocomplete="family-name" />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" v-model="form.password" type="password" placeholder="Mínimo 8 caracteres" required minlength="8" autocomplete="new-password" />
          </div>

          <p v-if="registerError" class="error-msg">{{ registerError }}</p>

          <button type="submit" class="btn btn-primary btn-full" :disabled="registering">
            {{ registering ? 'Creando cuenta...' : 'Crear cuenta y unirme al club' }}
          </button>
        </form>

        <!-- CASO C: Email con cuenta existente → ir a login -->
        <div v-else class="auth-notice">
          <p>El correo <strong>{{ invitacion.email }}</strong> ya tiene una cuenta.<br>Inicia sesión para aceptar la invitación.</p>
          <router-link :to="`/login?redirect=/invitacion/${token}`" class="btn btn-primary btn-full">
            Iniciar Sesión
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { invitacionesAPI } from '../api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = route.params.token;
const isAuthenticated = authStore.isAuthenticated;

const loading      = ref(true);
const invalid      = ref(false);
const accepting    = ref(false);
const registering  = ref(false);
const accepted     = ref(false);
const invitacion   = ref(null);
const clubNombre   = ref('');
const invalidMessage = ref('');
const acceptError    = ref('');
const registerError  = ref('');

const form = ref({ nombre: '', apellido: '', password: '' });

onMounted(async () => {
  try {
    const res = await invitacionesAPI.verificar(token);
    invitacion.value = res.data;
    clubNombre.value = res.data.club?.nombre || '';
  } catch (err) {
    invalid.value = true;
    invalidMessage.value = err.response?.data?.message || 'Esta invitación no existe o ya no está disponible.';
    loading.value = false;
    return;
  }

  loading.value = false;

  // Si ya está autenticado, aceptar automáticamente
  if (isAuthenticated.value) {
    await handleAceptar();
  }
});

const handleAceptar = async () => {
  accepting.value = true;
  acceptError.value = '';
  try {
    await invitacionesAPI.aceptar(token);
    invitacion.value = null;
    accepted.value = true;
    await authStore.fetchUserProfile();
    setTimeout(() => router.push('/clubs'), 1500);
  } catch (err) {
    acceptError.value = err.response?.data?.message || 'Error al aceptar la invitación.';
  } finally {
    accepting.value = false;
  }
};

const handleRegistrar = async () => {
  registerError.value = '';
  registering.value = true;
  try {
    const res = await invitacionesAPI.registrar(token, {
      nombre:   form.value.nombre,
      apellido: form.value.apellido,
      password: form.value.password,
    });
    // El backend devuelve tokens — iniciar sesión automáticamente
    await authStore.setSession(res.data);
    invitacion.value = null;
    accepted.value = true;
    setTimeout(() => router.push('/clubs'), 1500);
  } catch (err) {
    registerError.value = err.response?.data?.message || 'Error al crear la cuenta.';
  } finally {
    registering.value = false;
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

.state-icon { font-size: 3rem; }
.state h2 { font-size: 1.5rem; color: var(--text-primary); margin: 0; }
.state p  { color: var(--text-secondary); margin: 0; }

.invite-header {
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.invite-header h2 { font-size: 1.4rem; color: var(--text-primary); margin: 0; }

.invite-expiry {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Formulario de registro */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-intro {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.field input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus { border-color: var(--accent-blue); }

/* Email bloqueado */
.locked-email {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary, var(--bg-secondary));
  color: var(--text-primary);
  font-size: 0.95rem;
  user-select: none;
}

.lock-badge {
  font-size: 0.75rem;
  color: var(--accent-green, #16a34a);
  white-space: nowrap;
}

.btn-full { width: 100%; justify-content: center; }

/* Auth notice (email con cuenta) */
.auth-notice {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
}

.auth-notice p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.accept-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.btn-lg { padding: 0.75rem 2rem; font-size: 1rem; }

.error-msg { color: var(--accent-red); font-size: 0.875rem; margin: 0; }
</style>
