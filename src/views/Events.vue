<template>
  <div class="events-view">
    <header class="view-header">
      <div class="header-content">
        <h1>Gestión de Eventos</h1>
        <p class="subtitle">Administra los eventos de tu club</p>
      </div>
      <button class="btn btn-primary" @click="showCreateModal = true">
        ➕ Nuevo Evento
      </button>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando eventos...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="fetchEvents">Reintentar</button>
    </div>

    <div v-else class="events-container">
      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Estado:</label>
          <select v-model="filters.estado" @change="fetchEvents">
            <option value="">Todos</option>
            <option value="borrador">Borrador</option>
            <option value="abierto">Abierto</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
      </div>

      <!-- Events Grid -->
      <div v-if="events.length === 0" class="empty-state">
        <p>No hay eventos registrados.</p>
      </div>

      <div v-else class="events-grid">
        <div 
          v-for="event in events" 
          :key="event.id" 
          class="event-card"
          @click="goToDetail(event.id)"
        >
          <div class="card-header">
            <span :class="['status-badge', event.estado]">{{ event.estado }}</span>
            <span class="event-date">{{ formatDate(event.fecha_evento) }}</span>
          </div>
          <h3>{{ event.titulo }}</h3>
          <p class="description">{{ truncate(event.descripcion, 100) }}</p>
          <div class="card-footer">
            <span class="cost">{{ formatCurrency(event.costo_unitario) }}</span>
            <span class="type-badge">{{ event.tipo_evento }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Crear Nuevo Evento</h2>
        
        <div v-if="createError" class="alert alert-error">
          {{ createError }}
        </div>

        <form @submit.prevent="createEvent">
          <div class="form-group">
            <label>Título</label>
            <input v-model="newEvent.titulo" required type="text" placeholder="Ej: Asado fin de año">
          </div>
          
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="newEvent.descripcion" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="newEvent.tipo_evento" required>
                <option value="social">Social</option>
                <option value="deportivo">Deportivo</option>
                <option value="torneo">Torneo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Costo Unitario</label>
              <input v-model.number="newEvent.costo_unitario" required type="number" min="0">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha Evento</label>
              <input v-model="newEvent.fecha_evento" required type="date">
            </div>
            <div class="form-group">
              <label>Fecha Límite Pago</label>
              <input v-model="newEvent.fecha_limite_pago" required type="date">
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-text" @click="showCreateModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? 'Creando...' : 'Crear Evento' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useClubStore } from '../stores/club';
import { eventsAPI } from '../api';

const router = useRouter();
const clubStore = useClubStore();

const events = ref([]);
const loading = ref(false);
const error = ref(null);
const filters = ref({
  estado: ''
});

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

const selectedClubId = computed(() => clubStore.selectedClub.value?.id);

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
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Error al crear evento');
  } finally {
    creating.value = false;
  }
};

const goToDetail = (id) => {
  router.push(`/events/${id}`);
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
watch(selectedClubId, (newId) => {
  if (newId) fetchEvents();
});

onMounted(() => {
  if (selectedClubId.value) {
    fetchEvents();
  }
});
</script>

<style scoped>
.events-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-bar {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.event-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border-color);
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
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.borrador { background: var(--bg-tertiary); color: var(--text-muted); }
.status-badge.abierto { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
.status-badge.cerrado { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }

.event-date {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.event-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.cost {
  font-weight: bold;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.type-badge {
  background: rgba(102, 126, 234, 0.1);
  color: var(--primary-light);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
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
}

.modal-content {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 500px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-secondary);
}

input, select, textarea {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 1rem;
  color: var(--text-primary);
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-primary { 
  background: var(--primary-gradient);
  box-shadow: var(--shadow-md);
}
.btn-primary:hover { 
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); }
.btn-text { background: none; color: var(--text-muted); }
.btn-text:hover { color: var(--text-primary); }

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.spinner {
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid var(--primary-light);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.alert {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
