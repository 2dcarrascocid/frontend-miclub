<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-large">
            <span class="logo-icon">🔒</span>
          </div>
          <h1>Nueva contraseña</h1>
          <p>Elige una contraseña segura para tu cuenta.</p>
        </div>

        <template v-if="!tokenError && !success">
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label for="password" class="form-label">Nueva contraseña</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                class="form-input"
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label for="confirm" class="form-label">Confirmar contraseña</label>
              <input
                id="confirm"
                v-model="formData.confirm"
                type="password"
                class="form-input"
                placeholder="Repite la contraseña"
                required
                :disabled="loading"
              />
            </div>

            <div v-if="error" class="error-message">{{ error }}</div>

            <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Guardar nueva contraseña</span>
            </button>
          </form>
        </template>

        <div v-else-if="tokenError" class="error-box">
          <div class="error-icon">⚠️</div>
          <p>{{ tokenError }}</p>
          <router-link to="/forgot-password" class="btn btn-secondary btn-block" style="margin-top: 1rem;">
            Solicitar nuevo enlace
          </router-link>
        </div>

        <div v-else class="success-box">
          <div class="success-icon">✅</div>
          <p>Tu contraseña ha sido actualizada exitosamente.</p>
          <router-link to="/login" class="btn btn-primary btn-block" style="margin-top: 1rem;">
            Iniciar sesión
          </router-link>
        </div>

        <div v-if="!success && !tokenError" class="auth-footer">
          <p>
            <router-link to="/login" class="link">Volver al inicio de sesión</router-link>
          </p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { authAPI } from '../api/index.js';

const route = useRoute();

const formData = ref({ password: '', confirm: '' });
const loading = ref(false);
const error = ref('');
const tokenError = ref('');
const success = ref(false);
const token = ref('');

onMounted(() => {
  token.value = route.query.token || '';
  if (!token.value) {
    tokenError.value = 'El enlace es inválido o ha expirado. Solicita uno nuevo.';
  }
});

const handleSubmit = async () => {
  error.value = '';

  if (formData.value.password !== formData.value.confirm) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  if (formData.value.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres';
    return;
  }

  loading.value = true;

  try {
    await authAPI.resetPassword(token.value, formData.value.password);
    success.value = true;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al actualizar la contraseña';
    if (msg.includes('expirado') || msg.includes('inválido') || msg.includes('utilizado')) {
      tokenError.value = msg;
    } else {
      error.value = msg;
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.auth-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
  animation: fadeIn 0.5s ease-out;
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.logo-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--primary-gradient);
  border-radius: var(--radius-xl);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-glow);
}

.logo-icon {
  font-size: 2.5rem;
}

.auth-header h1 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-sm);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.auth-form {
  margin-bottom: var(--spacing-xl);
}

.btn-block {
  width: 100%;
  margin-top: var(--spacing-lg);
  display: block;
  text-align: center;
  text-decoration: none;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
  animation: shake 0.3s ease-in-out;
}

.error-box {
  text-align: center;
  padding: var(--spacing-xl);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.error-box p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.success-box {
  text-align: center;
  padding: var(--spacing-xl);
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xl);
}

.success-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
}

.success-box p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.auth-footer {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.auth-footer p {
  color: var(--text-secondary);
  margin: 0;
}

.link {
  color: var(--primary-light);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--transition-base);
}

.link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.auth-decoration {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: var(--primary-gradient);
  opacity: 0.05;
  animation: float 20s ease-in-out infinite;
}

.circle-1 { width: 400px; height: 400px; top: -200px; right: -200px; animation-delay: 0s; }
.circle-2 { width: 300px; height: 300px; bottom: -150px; left: -150px; animation-delay: 5s; }
.circle-3 { width: 200px; height: 200px; top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: 10s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@media (max-width: 768px) {
  .auth-card { padding: var(--spacing-xl); }
  .auth-header h1 { font-size: 1.5rem; }
}
</style>
