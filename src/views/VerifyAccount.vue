<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-large">
            <span class="logo-icon">{{ success ? '✅' : (loading ? '⏳' : '❌') }}</span>
          </div>
          <h1>Verificación de Cuenta</h1>
        </div>

        <div class="auth-content">
            <div v-if="loading" class="status-message">
                <span class="spinner large-spinner"></span>
                <p>Verificando tu cuenta...</p>
            </div>

            <div v-else-if="success" class="status-message success">
                <p class="message-text">¡Tu cuenta ha sido verificada exitosamente!</p>
                <p class="sub-text">Ahora puedes iniciar sesión para acceder a la plataforma.</p>
                <router-link to="/login" class="btn btn-primary btn-block action-btn">
                    Ir al Inicio de Sesión
                </router-link>
            </div>

            <div v-else class="status-message error">
                <p class="message-text">Hubo un problema al verificar tu cuenta.</p>
                <p class="error-detail">{{ error }}</p>
                <router-link to="/login" class="btn btn-secondary btn-block action-btn">
                    Volver al Inicio
                </router-link>
            </div>
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
import { authAPI } from '../api';

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const error = ref('');

onMounted(async () => {
    const token = route.query.token;

    if (!token) {
        error.value = 'Token de verificación no proporcionado.';
        loading.value = false;
        return;
    }

    try {
        await authAPI.verifyAccount(token);
        success.value = true;
    } catch (err) {
        console.error("Verification error:", err);
        error.value = err.response?.data?.message || 'El token es inválido o ha expirado.';
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-dark);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 10;
}

.auth-card {
  background: var(--bg-card);
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-color);
  text-align: center;
}

.auth-header {
  margin-bottom: 2rem;
}

.logo-large {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.logo-icon {
  font-size: 2.5rem;
}

h1 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.status-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.large-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-left-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.message-text {
    font-size: 1.1rem;
    color: var(--text-primary);
    margin: 0;
}

.sub-text {
    color: var(--text-secondary);
    margin: 0;
    margin-bottom: 1rem;
}

.error-detail {
    color: var(--accent-red);
    font-weight: 500;
    margin: 0;
    margin-bottom: 1rem;
}

.action-btn {
    margin-top: 1rem;
}

/* Decoration Circles */
.auth-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: var(--primary-color);
  top: -20%;
  left: -20%;
}

.circle-2 {
  width: 250px;
  height: 250px;
  background: var(--secondary-color);
  bottom: -10%;
  right: -10%;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: var(--accent-blue);
  top: 40%;
  left: 30%;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
