<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-large">
            <span class="logo-icon">⚽</span>
          </div>
          <h1>Crear Cuenta</h1>
          <p>Únete a Fairplay Club</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="nombre" class="form-label">Nombre Completo</label>
            <input
              id="nombre"
              v-model="formData.nombre"
              type="text"
              class="form-input"
              placeholder="Juan Pérez"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="form-input"
              placeholder="tu@email.com"
              required
              :disabled="loading"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              minlength="6"
              :disabled="loading"
            />
            <small class="form-hint">Mínimo 6 caracteres</small>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Crear Cuenta</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>¿Ya tienes una cuenta? 
            <router-link to="/login" class="link">Inicia Sesión</router-link>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  // Validar contraseñas
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const { confirmPassword, ...registerData } = formData.value;
    await authStore.register(registerData);
    router.push('/dashboard');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al registrarse';
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
  animation: pulse 2s ease-in-out infinite;
}

.logo-icon {
  font-size: 3rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.auth-header h1 {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-header p {
  color: var(--text-muted);
  font-size: 1rem;
}

.auth-form {
  margin-bottom: var(--spacing-xl);
}

.form-hint {
  display: block;
  margin-top: var(--spacing-xs);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.btn-block {
  width: 100%;
  margin-top: var(--spacing-lg);
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.circle-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -200px;
  animation-delay: 0s;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -150px;
  animation-delay: 5s;
}

.circle-3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@media (max-width: 768px) {
  .auth-card {
    padding: var(--spacing-xl);
  }

  .auth-header h1 {
    font-size: 1.75rem;
  }
}
</style>
