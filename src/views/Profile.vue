<template>
  <div class="profile-page">
    <div class="container">
      <div class="page-header">
        <h1>👤 Mi Perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>

      <div class="profile-content">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar-large">
              {{ userInitials }}
            </div>
            <div class="profile-info">
              <h2>{{ user?.nombre || 'Usuario' }}</h2>
              <p>{{ user?.email }}</p>
            </div>
          </div>

          <div class="profile-details">
            <h3>Información Personal</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Nombre</span>
                <span class="detail-value">{{ user?.nombre || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ user?.email || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teléfono</span>
                <span class="detail-value">{{ user?.telefono || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Posición</span>
                <span class="detail-value">{{ user?.posicion || 'No especificado' }}</span>
              </div>
            </div>
          </div>

          <div class="profile-actions">
            <button class="btn btn-outline" disabled>
              ✏️ Editar Perfil (Próximamente)
            </button>
            <button @click="handleLogout" class="btn btn-danger">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user.value);

const userInitials = computed(() => {
  const name = user.value?.nombre || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-xs);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  color: var(--text-muted);
  margin: 0;
}

.profile-content {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  padding-bottom: var(--spacing-2xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-2xl);
}

.profile-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-glow);
  flex-shrink: 0;
}

.profile-info h2 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1.75rem;
}

.profile-info p {
  margin: 0;
  color: var(--text-muted);
}

.profile-details {
  margin-bottom: var(--spacing-2xl);
}

.profile-details h3 {
  margin-bottom: var(--spacing-lg);
  font-size: 1.25rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.profile-actions {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    flex-direction: column;
  }

  .profile-actions .btn {
    width: 100%;
  }
}
</style>
