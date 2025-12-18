<template>
  <div class="events-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h2 class="inline">📅</h2>
          <h1 class="inline">Gestión de Eventos</h1>
          <p>Administra los eventos de tu club</p>
        </div>
        
        <div class="header-actions">
          <select v-model="selectedClubId" class="club-select" @change="fetchEvents">
            <option value="" disabled>Selecciona un club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.nombre }}
            </option>
          </select>
          <div class="action-buttons">
            <button class="btn btn-primary" @click="showCreateModal = true" :disabled="!selectedClubId">
              ➕ Nuevo Evento
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando eventos...</p>
      </div>

      <!-- No Club Selected -->
      <div v-else-if="!selectedClubId" class="empty-state">
        <span class="empty-icon">👆</span>
        <h3>Selecciona un club</h3>
        <p>Elige un club para ver sus eventos</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="fetchEvents">Reintentar</button>
      </div>

      <div v-else>
        <div class="events-section">
          <div class="section-header">
            <div class="header-left">
              <h2>Eventos del Club</h2>
              <span class="total-badge" v-if="events.length">{{ events.length }} eventos</span>
            </div>
            <div class="filter-controls">
              <button 
                class="filter-btn" 
                :class="{ active: !filters.estado }" 
                @click="filters.estado = ''; fetchEvents()"
              >
                Todos
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: filters.estado === 'abierto' }" 
                @click="filters.estado = 'abierto'; fetchEvents()"
              >
                Abiertos
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: filters.estado === 'cerrado' }" 
                @click="filters.estado = 'cerrado'; fetchEvents()"
              >
                Cerrados
              </button>
            </div>
          </div>

          <div v-if="events.length === 0" class="empty-list">
            <p>No hay eventos registrados.</p>
          </div>

          <div v-else class="events-grid">
            <div 
              v-for="event in events" 
              :key="event.id" 
              class="event-card"
              :class="event.estado"
              @click="goToDetail(event.id)"
            >
              <div class="card-header">
                <div class="card-type">
                  <span class="type-icon">{{ getEventIcon(event.tipo_evento) }}</span>
                  <span class="type-text">{{ event.tipo_evento }}</span>
                </div>
                <span :class="['status-badge', event.estado]">{{ event.estado }}</span>
              </div>
              
              <div class="card-body">
                <h3 class="card-title">{{ event.titulo }}</h3>
                <p class="card-description">{{ truncate(event.descripcion, 100) }}</p>
                
                <div class="card-row">
                  <span class="card-label">Fecha:</span>
                  <span class="card-value">{{ formatDate(event.fecha_evento) }}</span>
                </div>
                <div class="card-row">
                  <span class="card-label">Costo:</span>
                  <span class="card-value cost">{{ formatCurrency(event.costo_unitario) }}</span>
                </div>
              </div>
              
              <div class="card-footer">
                <span class="registrado-por">Ver detalles →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Crear Nuevo Evento</h2>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        
        <div v-if="createError" class="alert alert-error">
          {{ createError }}
        </div>

        <form @submit.prevent="createEvent">
          <div class="form-group">
            <label>Título</label>
            <input 
              v-model="newEvent.titulo" 
              required 
              type="text" 
              placeholder="Ej: Asado fin de año"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label>Descripción</label>
            <textarea 
              v-model="newEvent.descripcion" 
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="newEvent.tipo_evento" required class="form-select">
                <option value="social">Social</option>
                <option value="deportivo">Deportivo</option>
                <option value="torneo">Torneo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Costo Unitario</label>
              <input 
                v-model.number="newEvent.costo_unitario" 
                required 
                type="number" 
                min="0"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha Evento</label>
              <input v-model="newEvent.fecha_evento" required type="date" class="form-input">
            </div>
            <div class="form-group">
              <label>Fecha Límite Pago</label>
              <input v-model="newEvent.fecha_limite_pago" required type="date" class="form-input">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="showCreateModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? 'Creando...' : 'Crear Evento' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      <span class="notification-icon">{{ notification.type === 'success' ? '✅' : (notification.type === 'error' ? '⚠️' : 'ℹ️') }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button class="notification-close" @click="notification.show = false">×</button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useClubStore } from '../stores/club';
import { useAuthStore } from '../stores/auth';
import { eventsAPI, clubsAPI } from '../api';

const router = useRouter();
const route = useRoute();
const clubStore = useClubStore();
const authStore = useAuthStore();

const events = ref([]);
const clubs = ref([]);
const selectedClubId = ref('');
const loading = ref(false);
const error = ref(null);
const filters = ref({
  estado: ''
});

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

const showCreateModal = ref(false);
const creating = ref(false);
const newEvent = ref({
  titulo: '',
  descripcion: '',
  tipo_evento: 'social',
  costo_unitario: 0,
  fecha_evento: '',
  fecha_limite_pago: ''
});

const loadClubs = async () => {
  try {
    const userId = authStore.user.value?.id;
    const response = await clubsAPI.getAll({ owner_id: userId });
    clubs.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error loading clubs:', error);
  }
};

const fetchEvents = async () => {
  if (!selectedClubId.value) return;
  
  loading.value = true;
  error.value = null;
  try {
    const params = {};
    if (filters.value.estado) params.estado = filters.value.estado;
    
    const response = await eventsAPI.getAll(selectedClubId.value, params);
    events.value = response.data;
  } catch (err) {
    console.error(err);
    error.value = 'Error al cargar eventos';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadClubs();

  if (route.query.club) {
    selectedClubId.value = route.query.club;
  } else if (clubStore.selectedClub.value) {
    selectedClubId.value = clubStore.selectedClub.value.id;
  } else if (clubs.value.length > 0) {
    selectedClubId.value = clubs.value[0].id;
  }
});

watch(selectedClubId, (newId) => {
  if (newId) fetchEvents();
});

const createEvent = async () => {
  if (!selectedClubId.value) return;

  creating.value = true;
  try {
    await eventsAPI.create(selectedClubId.value, newEvent.value);
    showCreateModal.value = false;
    // Reset form
    newEvent.value = {
      titulo: '',
      descripcion: '',
      tipo_evento: 'social',
      costo_unitario: 0,
      fecha_evento: '',
      fecha_limite_pago: ''
    };
    fetchEvents();
    showNotification('Evento creado correctamente', 'success');
  } catch (err) {
    console.error(err);
    showNotification(err.response?.data?.message || 'Error al crear evento', 'error');
  } finally {
    creating.value = false;
  }
};

const goToDetail = (id) => {
  router.push(`/events/${id}`);
};

const getEventIcon = (type) => {
  const icons = {
    social: '🎉',
    deportivo: '⚽',
    torneo: '🏆',
    otro: '📅'
  };
  return icons[type] || '📅';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

    // Watch for club changes
    /* watch(selectedClubId, (newId) => {
      if (newId) fetchEvents();
    }); */
    
    /* onMounted(() => {
      if (selectedClubId.value) {
        fetchEvents();
      }
    }); */
</script>

<style scoped>
/* Page Layout */
.events-page {
  padding-bottom: var(--spacing-2xl);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-xs);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.inline {
  display: inline-block;
  margin-right: var(--spacing-sm);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.club-select {
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  min-width: 250px;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-base);
}

.club-select:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

/* States */
.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--border-color);
  margin-top: var(--spacing-xl);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
  animation: bounce 2s infinite;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-light);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Section Header & Filters */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.total-badge {
  background: var(--bg-tertiary);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.filter-controls {
  display: flex;
  background: var(--bg-tertiary);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-weight: 500;
  font-size: 0.875rem;
}

.filter-btn:hover {
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--bg-card);
  color: var(--primary-light);
  box-shadow: var(--shadow-sm);
}

/* Events Grid & Cards */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.event-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.card-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.type-icon {
  font-size: 1.25rem;
}

.type-text {
  font-weight: 600;
  color: var(--text-primary);
  text-transform: capitalize;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.borrador { background: var(--bg-tertiary); color: var(--text-muted); }
.status-badge.abierto { background: rgba(16, 185, 129, 0.2); color: var(--accent-green); }
.status-badge.cerrado { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }

.card-body {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.card-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: var(--spacing-md);
  line-height: 1.5;
}

.card-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: 0.9rem;
}

.card-label {
  color: var(--text-muted);
}

.card-value {
  color: var(--text-primary);
  font-weight: 500;
}

.card-value.cost {
  color: var(--primary-light);
  font-weight: 700;
  font-size: 1.1rem;
}

.card-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  text-align: right;
}

.registrado-por {
  font-size: 0.875rem;
  color: var(--primary-light);
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: var(--spacing-md);
}

.modal-content {
  background: var(--bg-card);
  width: 100%;
  max-width: 600px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-2xl);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  line-height: 1;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

form {
  padding: var(--spacing-xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all var(--transition-base);
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: var(--bg-tertiary);
}

.form-row {
  display: flex;
  gap: var(--spacing-lg);
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

/* Toast Notification */
.notification-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-xl);
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 2000;
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color);
  max-width: 400px;
}

.notification-toast.success { border-left: 4px solid var(--accent-green); }
.notification-toast.error { border-left: 4px solid var(--accent-red); }
.notification-toast.info { border-left: 4px solid var(--primary-light); }

.notification-icon { font-size: 1.25rem; }
.notification-message { color: var(--text-primary); font-size: 0.95rem; }

.notification-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .club-select {
    width: 100%;
  }
  
  .action-buttons {
    width: 100%;
  }
  
  .action-buttons button {
    flex: 1;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
}
</style>
