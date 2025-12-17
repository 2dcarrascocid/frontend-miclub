<template>
  <div class="clubs-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h2 class="inline">🏆</h2>
          <h1 class="inline">Mis Clubes</h1>
          <p>Administra tus clubes deportivos</p>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          ➕ Nuevo Club
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando clubes...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="clubs.length === 0" class="empty-state">
        <span class="empty-icon">🏆</span>
        <h3>No tienes clubes registrados</h3>
        <p>Crea tu primer club para comenzar a gestionar jugadores y finanzas</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Crear Primer Club
        </button>
      </div>

      <!-- Clubs Grid -->
      <div v-else class="clubs-grid">
        <div v-for="club in clubs" :key="club.id" class="card club-card">
          <div class="card-header flex justify-between items-center">
            <div class="club-icon">
              {{ club.nombre.charAt(0).toUpperCase() }}
            </div>
            <div class="club-actions">
              <button class="btn-icon" @click="editClub(club)" title="Editar">✏️</button>
              <button class="btn-icon delete" @click="deleteClub(club.id)" title="Eliminar">🗑️</button>
            </div>
          </div>
          
          <div class="card-body">
            <h3 class="card-title">{{ club.nombre }}</h3>
            <p class="description">{{ club.descripcion || 'Sin descripción disponible' }}</p>
            
            <div class="club-meta mt-3">
              <div class="meta-item">
                <span class="label">Creado:</span>
                <span class="value">{{ formatDate(club.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-outline btn-sm" @click="goToClubDetail(club)">
              Ver Detalles
            </button>
            <router-link :to="`/players?club=${club.id}`" class="btn btn-outline btn-sm">
              Jugadores
            </router-link>
            <router-link :to="`/finance?club=${club.id}`" class="btn btn-outline btn-sm">
              Finanzas
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Club' : 'Nuevo Club' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Nombre del Club</label>
            <input 
              type="text" 
              v-model="form.nombre" 
              placeholder="Ej: Los Galácticos FC"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea 
              v-model="form.descripcion" 
              placeholder="Descripción breve del club..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Club') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { clubsAPI } from '../api';

const router = useRouter();
const authStore = useAuthStore();
const clubs = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = reactive({
  nombre: '',
  descripcion: ''
});

onMounted(() => {
  loadClubs();
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
        // Fallback in case backend structure varies slightly
        clubs.value = response.data.clubes;
    } else {
        clubs.value = [];
        console.warn('Unexpected response format:', response.data);
    }
  } catch (error) {
    console.error('Error loading clubs:', error);
  } finally {
    loading.value = false;
  }
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
    form.nombre = '';
    form.descripcion = '';
    showCreateModal.value = true;
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const userId = authStore.user.value?.id;
    const clubData = {
      ...form,
      owner_id: userId,
      admin_id: userId // Some backends might use admin_id vs owner_id
    };

    if (isEditing.value) {
      await clubsAPI.update({ ...clubData, id: editingId.value });
    } else {
      await clubsAPI.create(clubData);
    }

    await loadClubs();
    closeModal();
  } catch (error) {
    console.error('Error saving club:', error);
    alert('Error al guardar el club');
  } finally {
    submitting.value = false;
  }
};

const editClub = (club) => {
  isEditing.value = true;
  editingId.value = club.id;
  form.nombre = club.nombre;
  form.descripcion = club.descripcion;
  showCreateModal.value = true;
};

const deleteClub = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este club?')) return;
  
  try {
    await clubsAPI.delete(id);
    await loadClubs();
  } catch (error) {
    console.error('Error deleting club:', error);
    alert('Error al eliminar el club');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  isEditing.value = false;
  editingId.value = null;
  form.nombre = '';
  form.descripcion = '';
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

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}

.club-card {
  display: flex;
  flex-direction: column;
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
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
  opacity: 0.7;
}

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

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
