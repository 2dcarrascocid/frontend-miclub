<template>
  <div class="profile-page">
    <div class="container">
      <div class="page-header">
        <h2 class="inline">👤</h2>
        <h1 class="inline">Mi Perfil</h1>
        <p>Gestiona tu información personal, clubes y membresía</p>
      </div>

      <div class="profile-content">
        <!-- User Profile Card -->
        <div class="profile-card user-card">
          <div class="profile-header">
            <div class="profile-avatar-large">
              <img v-if="userPhoto" :src="userPhoto" alt="Avatar" class="avatar-img">
              <span v-else>{{ userInitials }}</span>
            </div>
            <div class="profile-info">
              <h2>{{ displayName }}</h2>
              <p>{{ user?.email }}</p>
              <div class="profile-badges mt-2">
                <span v-for="role in userRoles" :key="role" class="badge badge-primary mr-2">{{ formatRole(role) }}</span>
              </div>
            </div>
            <div class="profile-actions-top">
              <button class="btn btn-outline btn-sm" @click="openEditUserModal">
                ✏️ Editar Datos
              </button>
            </div>
          </div>
          
          <div class="profile-details-grid">
            <div class="detail-item">
              <span class="detail-label">Nombre</span>
              <span class="detail-value">{{ user?.metadata?.nombre || user?.nombre || 'No especificado' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Apellido</span>
              <span class="detail-value">{{ user?.metadata?.apellido || 'No especificado' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ user?.email }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Miembro desde</span>
              <span class="detail-value">{{ formatDate(user?.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs Container -->
        <div class="profile-card tabs-card mt-4">
          <div class="tabs-header">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'clubs' }"
              @click="activeTab = 'clubs'"
            >
              🏆 Mis Clubes
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'roles' }"
              @click="activeTab = 'roles'"
            >
              🛡️ Roles y Permisos
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'plan' }"
              @click="activeTab = 'plan'"
            >
              💎 Mi Plan
            </button>
          </div>

          <div class="tabs-content">
            <!-- CLUBS TAB -->
            <div v-if="activeTab === 'clubs'" class="tab-pane fade-in">
              <div v-if="userClubs.length > 0" class="clubs-grid">
                <div v-for="club in userClubs" :key="club.id" class="club-item-card">
                  <div class="club-img-wrapper">
                    <img :src="club.path_foto && club.path_foto !== '/' ? club.path_foto : '/default-club.png'" :alt="club.nombre" class="club-img" @error="$event.target.src='/default-club.png'">
                    <span class="club-sport-badge">{{ getSportIcon(club.deporte) }}</span>
                  </div>
                  <div class="club-info">
                    <h3>{{ club.nombre }}</h3>
                    <p class="club-desc">{{ truncateText(club.descripcion, 60) }}</p>
                    <div class="club-actions">
                      <button class="btn btn-primary btn-sm w-full" @click="openEditClubModal(club)">
                        ⚙️ Administrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <span class="empty-icon">⚽</span>
                <h3>No tienes clubes registrados</h3>
                <p>Crea tu primer club para comenzar a gestionar tus equipos.</p>
                <!-- Opcional: Botón para ir a crear club si la lógica lo permite aquí o redirigir -->
              </div>
            </div>

            <!-- ROLES & PERMISSIONS TAB -->
            <div v-if="activeTab === 'roles'" class="tab-pane fade-in">
              <div class="roles-section mb-4">
                <h3 class="section-title">Mis Roles</h3>
                <div class="badges-list">
                  <span v-for="role in userRoles" :key="role" class="badge badge-primary badge-lg">
                    {{ formatRole(role) }}
                  </span>
                </div>
              </div>
              
              <div class="permissions-section">
                <h3 class="section-title">Mis Permisos</h3>
                <div class="permissions-grid">
                  <div v-for="(perm, index) in permissions" :key="index" class="permission-card">
                    <div class="perm-icon">{{ perm.icono }}</div>
                    <div class="perm-info">
                      <h4>{{ perm.nombre }}</h4>
                      <p>Ruta: <code>{{ perm.ruta }}</code></p>
                      <span class="badge" :class="perm.puede_editar ? 'badge-success' : 'badge-warning'">
                        {{ perm.puede_editar ? 'Edición' : 'Lectura' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- PLAN TAB -->
            <div v-if="activeTab === 'plan'" class="tab-pane fade-in">
              <div v-if="userPlan" class="plan-details">
                <div class="plan-header-card">
                  <div class="plan-icon">💎</div>
                  <div class="plan-info-main">
                    <h3>Plan Actual: {{ userPlan.plan || 'Básico' }}</h3>
                    <p>ID de Suscripción: {{ userPlan.id }}</p>
                  </div>
                  <div class="plan-status">
                    <span class="badge badge-success">Activo</span>
                  </div>
                </div>
                <!-- Future: Add more plan details or upgrade options here -->
              </div>
              <div v-else class="empty-state">
                <span class="empty-icon">📝</span>
                <h3>Sin Plan Activo</h3>
                <p>Actualmente no tienes un plan de suscripción activo.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="logout-section mt-4">
          <button @click="handleLogout" class="btn btn-danger w-full">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </div>

    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      <span class="notification-icon">{{ notification.type === 'success' ? '✅' : (notification.type === 'error' ? '⚠️' : 'ℹ️') }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button class="notification-close" @click="notification.show = false">×</button>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Editar Mis Datos</h2>
          <button class="close-btn" @click="closeUserModal">×</button>
        </div>
        
        <form @submit.prevent="handleUserSubmit">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input 
              type="text" 
              v-model="userForm.nombre" 
              placeholder="Tu nombre"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Apellido</label>
            <input 
              type="text" 
              v-model="userForm.apellido" 
              placeholder="Tu apellido"
              class="form-input"
            >
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeUserModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Club Modal -->
    <div v-if="showEditClubModal" class="modal-overlay" @click.self="closeClubModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Editar Club</h2>
          <button class="close-btn" @click="closeClubModal">×</button>
        </div>
        
        <ClubForm 
          :initial-data="selectedClub" 
          :is-editing="true" 
          @success="handleClubSuccess" 
          @cancel="closeClubModal" 
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../api';
import ClubForm from '../components/ClubForm.vue';
import sportOptions from '../../sport-options.json';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user.value);
const userClubs = computed(() => authStore.userClubs.value || []);
const userRoles = computed(() => authStore.userRoles.value || []);
const permissions = computed(() => authStore.permissions.value || []);
const userPlan = computed(() => authStore.userPlan.value);

const activeTab = ref('clubs');
const showEditUserModal = ref(false);
const showEditClubModal = ref(false);
const submitting = ref(false);
const selectedClub = ref({});

const notification = reactive({
  show: false,
  message: '',
  type: 'success'
});

const userForm = reactive({
  nombre: '',
  apellido: '',
  path_foto: null
});

const showNotification = (message, type = 'success') => {
  notification.message = message;
  notification.type = type;
  notification.show = true;
  setTimeout(() => {
    notification.show = false;
  }, 3000);
};

const userInitials = computed(() => {
  const name = user.value?.metadata?.nombre || user.value?.nombre || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const userPhoto = computed(() => {
    return user.value?.metadata?.path_foto || user.value?.path_foto || null;
});

const displayName = computed(() => {
    const meta = user.value?.metadata || {};
    if (meta.nombre && meta.apellido) return `${meta.nombre} ${meta.apellido}`;
    return meta.nombre || user.value?.nombre || 'Usuario';
});

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  try {
    const response = await authAPI.getProfile();
    // Update store with fresh data via login-like update or specific actions
    // Since we don't have a bulk update action, we manually update parts
    if (response.data) {
        if (response.data.usuario) authStore.updateUserData(response.data.usuario);
        
        // Update other parts in localStorage and State directly if possible, or reload page/re-login
        // Ideally authStore should expose methods to update these. 
        // For now, we assume the initial load or login set these correctly, 
        // but we can try to update state if authStore allows.
        // authStore.state.userClubs = response.data.clubes; // Direct state mutation if allowed
        // But better to rely on what we have or implement a proper store action.
        
        // Let's assume the store is reactive and we can update it:
        if (response.data.clubes) authStore.state.userClubs = response.data.clubes;
        if (response.data.roles) authStore.state.userRoles = response.data.roles;
        if (response.data.permisos) authStore.state.permissions = response.data.permisos;
        if (response.data.plan) authStore.state.userPlan = response.data.plan;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};

// User Edit Logic
const openEditUserModal = () => {
  const userData = user.value;
  const metadata = userData?.metadata || {};
  
  userForm.nombre = metadata.nombre || userData?.nombre || '';
  userForm.apellido = metadata.apellido || userData?.apellido || '';
  userForm.path_foto = metadata.path_foto || userData?.path_foto || null;
  
  showEditUserModal.value = true;
};

const closeUserModal = () => {
  showEditUserModal.value = false;
};

const handleUserSubmit = async () => {
  submitting.value = true;
  try {
    const response = await authAPI.updateProfile(userForm);
    if (response.data && response.data.usuario) {
        authStore.updateUserData(response.data.usuario);
        showNotification('Perfil actualizado correctamente', 'success');
        closeUserModal();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    showNotification('Error al actualizar perfil', 'error');
  } finally {
    submitting.value = false;
  }
};

// Club Edit Logic
const openEditClubModal = (club) => {
  selectedClub.value = { ...club };
  showEditClubModal.value = true;
};

const closeClubModal = () => {
  showEditClubModal.value = false;
  selectedClub.value = {};
};

const handleClubSuccess = async () => {
  showNotification('Club actualizado correctamente', 'success');
  closeClubModal();
  await loadProfile(); // Reload to get fresh data
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Helpers
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatRole = (role) => {
  return role.replace(/_/g, ' ').toUpperCase();
};

const getSportIcon = (sportValue) => {
  const sport = sportOptions.find(s => s.value === sportValue);
  return sport ? sport.icon : '🏆';
};

const truncateText = (text, length) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
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
  max-width: 900px;
  margin: 0 auto;
}

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

/* User Card Styles */
.profile-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-lg);
}

.profile-avatar-large {
  width: 80px;
  height: 80px;
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

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.profile-info {
  flex: 1;
}

.profile-info h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.profile-info p {
  margin: 0;
  color: var(--text-muted);
}

.profile-actions-top {
  flex-shrink: 0;
}

.profile-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  font-weight: 500;
  color: var(--text-primary);
}

/* Tabs Styles */
.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-md);
  overflow-x: auto;
  padding-bottom: 1px; /* Avoid border overlap */
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--primary-light);
  border-bottom-color: var(--primary-light);
}

/* Clubs Grid */
.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.club-item-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.2s;
}

.club-item-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary-light);
}

.club-img-wrapper {
  height: 140px;
  background: var(--bg-tertiary);
  position: relative;
}

.club-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-sport-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.6);
  padding: 4px;
  border-radius: 50%;
  font-size: 1.2rem;
  backdrop-filter: blur(4px);
}

.club-info {
  padding: var(--spacing-md);
}

.club-info h3 {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.club-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  height: 2.5em; /* 2 lines approx */
  overflow: hidden;
}

/* Permissions Grid */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

.permission-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.perm-icon {
  font-size: 1.5rem;
  background: var(--bg-tertiary);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perm-info h4 {
  font-size: 1rem;
  margin-bottom: 2px;
}

.perm-info p {
  font-size: 0.75rem;
  margin-bottom: 6px;
  color: var(--text-muted);
}

/* Plan Details */
.plan-header-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid var(--primary-dark);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.plan-icon {
  font-size: 2.5rem;
}

.plan-info-main h3 {
  font-size: 1.25rem;
  margin-bottom: 4px;
  color: var(--primary-light);
}

.plan-info-main p {
  font-size: 0.875rem;
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl) 0;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

/* Modal Styles Reuse */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 550px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

/* Utilities */
.inline { display: inline-block; margin: 0; }
.mr-2 { margin-right: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 2rem; }
.w-full { width: 100%; }
.badge-lg { padding: 0.5rem 1rem; font-size: 0.875rem; }

@media (max-width: 768px) {
  .profile-header { flex-direction: column; text-align: center; }
  .profile-actions-top { width: 100%; display: flex; justify-content: center; margin-top: 1rem; }
  .tabs-header { overflow-x: auto; white-space: nowrap; }
  .plan-header-card { flex-direction: column; text-align: center; }
}

.notification-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  color: white;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

.notification-toast.success { background: #10b981; }
.notification-toast.error { background: #ef4444; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
