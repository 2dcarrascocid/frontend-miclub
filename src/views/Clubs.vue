<template>
  <div class="clubs-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h2 class="inline">🏆</h2>
          <h1 class="inline">Mi Club</h1>
          <p>Administra tu club deportivo</p>
        </div>
        <button v-if="clubs.length === 0" class="btn btn-primary" @click="openCreateModal">
          ➕ Nuevo Club
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando tu club...</p>
      </div>

      <!-- Empty State — solo aparece si realmente no tiene clubs ni invitaciones -->
      <div v-else-if="clubs.length === 0" class="empty-state">
        <span class="empty-icon">🏆</span>
        <h3>¡Bienvenido! Crea tu primer club</h3>
        <p class="mb-4">Configura los datos básicos para comenzar a gestionar tu equipo.</p>
        <div class="empty-state-form-container">
          <ClubForm :show-cancel="false" @success="handleSuccess" />
        </div>
      </div>

      <!-- Club Card + Usuarios -->
      <div v-else class="club-card-wrapper">
        <div v-for="club in clubs" :key="club.id" class="card club-card">
          <div class="club-card-inner">
            <!-- Columna izquierda: icono + info -->
            <div class="club-main">
              <div class="club-card-top">
                <div class="club-icon">{{ getClubIcon(club) }}</div>
                <div>
                  <h3 class="card-title">{{ club.nombre }}</h3>
                  <p class="description">{{ club.descripcion || 'Sin descripción disponible' }}</p>
                </div>
              </div>

              <div class="club-meta">
                <div class="meta-item">
                  <span class="label">Deporte:</span>
                  <span class="value">{{ formatSport(club.deporte) }}</span>
                </div>
                <div class="meta-item">
                  <span class="label">Creado:</span>
                  <span class="value">{{ formatDate(club.created_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Columna derecha: acciones -->
            <div class="club-side">
              <div v-if="club.es_propietario" class="club-actions">
                <button class="btn-icon" @click="editClub(club)" title="Editar">✏️</button>
                <button class="btn-icon delete" @click="deleteClub(club.id)" title="Eliminar">🗑️</button>
              </div>
              <div class="card-footer">
                <button class="btn btn-outline btn-sm" @click="goToClubDetail(club)">Ver Detalles</button>
                <router-link :to="`/players?club=${club.id}`" class="btn btn-outline btn-sm">Jugadores</router-link>
                <router-link :to="`/finance?club=${club.id}`" class="btn btn-outline btn-sm">Finanzas</router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección Usuarios del Club -->
        <div class="users-section">
          <div class="users-section-header">
            <h3>Usuarios con acceso</h3>
            <button class="btn btn-primary btn-sm" @click="showInviteModal = true">
              ✉️ Invitar Usuario
            </button>
          </div>

          <div class="users-list">
            <div v-if="invitaciones.length === 0" class="users-empty">
              No hay usuarios invitados aún
            </div>
            <div v-for="inv in invitaciones" :key="inv.id" class="invite-row">
              <div class="invite-info">
                <span class="invite-email">{{ inv.email }}</span>
                <span class="invite-date">{{ formatInvDate(inv.created_at) }}</span>
              </div>
              <div class="invite-right">
                <span class="invite-badge" :class="inv.estado">{{ inv.estado }}</span>
                <button v-if="inv.estado === 'pendiente'" class="btn-icon" title="Copiar link" @click="copyLink(inv.link)">🔗</button>
                <button class="btn-icon delete" title="Eliminar" @click="eliminarInvitacion(clubs[0]?.id, inv.id)">🗑️</button>
              </div>
            </div>
          </div>

          <p v-if="copyMsg" class="copy-msg">{{ copyMsg }}</p>
        </div>
      </div>
    </div>

    <!-- Modal Invitar Usuario -->
    <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Invitar Usuario</h2>
          <button class="close-btn" @click="showInviteModal = false">×</button>
        </div>
        <form @submit.prevent="handleInvitar">
          <div class="form-group">
            <label>Correo electrónico *</label>
            <input
              type="email"
              v-model="inviteEmail"
              required
              class="form-input"
              placeholder="usuario@email.com"
              autofocus
            />
            <span v-if="inviteError" class="invite-error">{{ inviteError }}</span>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="showInviteModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="inviting">
              {{ inviting ? 'Enviando...' : 'Enviar Invitación' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Club' : 'Nuevo Club' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <ClubForm 
          :initial-data="currentClubData"
          :is-editing="isEditing"
          @success="handleSuccess"
          @cancel="closeModal"
        />
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      <span class="notification-icon">{{ notification.type === 'success' ? '✅' : (notification.type === 'error' ? '⚠️' : 'ℹ️') }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button class="notification-close" @click="notification.show = false">×</button>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :is-open="showConfirmModal"
      title="Eliminar Club"
      message="¿Estás seguro de que deseas eliminar este club? Esta acción no se puede deshacer."
      type="danger"
      confirm-text="Eliminar"
      @close="showConfirmModal = false"
      @confirm="confirmDelete"
    />

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { getSportIcon } from '../stores/club';
import { clubsAPI, invitacionesAPI } from '../api';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import ClubForm from '../components/ClubForm.vue';
import sportOptions from '../../sport-options.json';

const router = useRouter();
const authStore = useAuthStore();
const clubs = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const isEditing = ref(false);
const showConfirmModal = ref(false);
const currentClubData = ref({});

// Invitaciones
const invitaciones = ref([]);
const showInviteModal = ref(false);
const inviteEmail = ref('');
const inviting = ref(false);
const inviteError = ref('');
const copyMsg = ref('');

const notification = reactive({
  show: false,
  message: '',
  type: 'success'
});

const showNotification = (message, type = 'success') => {
  notification.message = message;
  notification.type = type;
  notification.show = true;
  setTimeout(() => {
    notification.show = false;
  }, 3000);
};

onMounted(async () => {
  await loadClubs();
});

const loadClubs = async () => {
  loading.value = true;
  try {
    // Usar ID específico solicitado para visualizar los datos de prueba
    // En producción, esto debería ser authStore.user.value?.id
    const userId = '0e05d871-9780-43c6-95b4-02f3d3db7444'; 
    console.log('Fetching clubs for owner_id:', userId);

    const response = await clubsAPI.getAll({ owner_id: userId });
    console.log('API Response:', response);
    
    // Handle the response directly as an array or typical response structure
    if (Array.isArray(response.data)) {
        clubs.value = response.data;
    } else if (response.data && Array.isArray(response.data.clubes)) {
        clubs.value = response.data.clubes;
    } else {
        clubs.value = [];
    }
    if (clubs.value.length > 0) {
      await loadInvitaciones(clubs.value[0].id);
    }
  } catch (error) {
    console.error('Error loading clubs:', error);
  } finally {
    loading.value = false;
  }
};

const loadInvitaciones = async (clubId) => {
  try {
    const res = await invitacionesAPI.listar(clubId);
    invitaciones.value = res.data || [];
  } catch (error) {
    console.error('Error loading invitaciones:', error);
  }
};

const handleInvitar = async () => {
  inviteError.value = '';
  inviting.value = true;
  try {
    const clubId = clubs.value[0]?.id;
    await invitacionesAPI.crear(clubId, inviteEmail.value);
    inviteEmail.value = '';
    showInviteModal.value = false;
    await loadInvitaciones(clubId);
  } catch (err) {
    inviteError.value = err.response?.data?.message || 'Error al enviar la invitación';
  } finally {
    inviting.value = false;
  }
};

const eliminarInvitacion = async (clubId, id) => {
  if (!confirm('¿Eliminar esta invitación?')) return;
  try {
    await invitacionesAPI.revocar(clubId, id);
    await loadInvitaciones(clubId);
  } catch (error) {
    console.error('Error eliminando invitación:', error);
  }
};

const copyLink = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    copyMsg.value = '¡Link copiado!';
    setTimeout(() => { copyMsg.value = ''; }, 2500);
  } catch {
    copyMsg.value = link;
  }
};

const formatInvDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

const goToClubDetail = (club) => {
  // Pass club object in state to avoid extra fetch if possible
  router.push({
    name: 'ClubDetail',
    params: { id: club.id },
    state: { clubStr: JSON.stringify(club) }
  });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const openCreateModal = () => {
    isEditing.value = false;
    currentClubData.value = {};
    showCreateModal.value = true;
};

const handleSuccess = async () => {
  await loadClubs();
  closeModal();
  showNotification('Club guardado correctamente');
};

const editClub = (club) => {
  isEditing.value = true;
  currentClubData.value = { ...club };
  showCreateModal.value = true;
};

const deleteClub = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este club?')) return;
  
  try {
    await clubsAPI.delete(id);
    await loadClubs();
    showNotification('Club eliminado correctamente', 'success');
  } catch (error) {
    console.error('Error deleting club:', error);
    showNotification('Error al eliminar el club', 'error');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  isEditing.value = false;
  currentClubData.value = {};
};

const getClubIcon = (club) => {
  const icon = getSportIcon(club?.deporte);
  if (icon) return icon;
  const fallback = club?.nombre?.charAt(0);
  return fallback ? fallback.toUpperCase() : '🏆';
};

const formatSport = (deporte) => {
  const value = (deporte || '').toString().trim().toLowerCase();
  const found = sportOptions.find(o => o.value === value);
  return found ? `${found.icon} ${found.label}` : '🎽 Otro';
};
</script>

<style scoped>
.clubs-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.club-card-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.club-card {
  width: 100%;
}

.club-card-inner {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
}

.club-main {
  flex: 1;
  min-width: 0;
}

.club-card-top {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.club-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.club-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.club-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
  /* padding: 4px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
  opacity: 0.7;
} */

.btn-icon:hover {
  background: var(--bg-hover);
  opacity: 1;
}

.btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

.card-title {
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
}

.description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.club-meta {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-md);
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.card-footer {
  margin-top: auto;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--shadow-2xl);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.75rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.close-btn:hover {
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.loading-state, .empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.inline {
  display: inline-block;
  margin: 0;
}

@media (max-width: 640px) {
  .club-card-inner {
    flex-direction: column;
  }

  .club-side {
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .card-footer {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* Usuarios del Club */
.users-section {
  border-top: 1px solid var(--border-color);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
}

.users-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.users-section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.users-empty {
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 0.75rem 0;
}

.invite-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0.875rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  gap: 1rem;
}

.invite-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.invite-email {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.invite-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.invite-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.invite-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
}

.invite-badge.pendiente { background: rgba(234,179,8,0.15); color: #ca8a04; }
.invite-badge.aceptada  { background: rgba(34,197,94,0.15); color: #16a34a; }
.invite-badge.revocada,
.invite-badge.vencida   { background: rgba(239,68,68,0.1);  color: #dc2626; }

.copy-msg {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  word-break: break-all;
}

.invite-error {
  display: block;
  color: var(--accent-red);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-state-form-container {
  max-width: 500px;
  margin: var(--spacing-xl) auto 0;
  text-align: left;
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
}
</style>
