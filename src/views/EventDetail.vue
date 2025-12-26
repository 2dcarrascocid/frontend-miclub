<template>
  <div class="event-detail-view" v-if="event">
    <!-- Header / Actions -->
    <div class="detail-header">
      <button class="back-btn" @click="$router.push('/events')">← Volver</button>
      <div class="actions">
        <button 
          v-if="event.estado === 'borrador'" 
          class="btn btn-success" 
          @click="changeStatus('abierto')"
        >
          🚀 Abrir Evento
        </button>
        <button 
          v-if="event.estado === 'abierto'" 
          class="btn btn-danger" 
          @click="confirmClose"
        >
          🔒 Cerrar Evento
        </button>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification" :class="['alert', `alert-${notification.type}`]">
      {{ notification.message }}
      <button class="close-alert" @click="notification = null">×</button>
    </div>

    <!-- Event Info / Edit Form -->
    <div class="info-card">
      <div class="card-header">
        <h2>Detalles del Evento</h2>
        <span :class="['status-badge', event.estado]">{{ event.estado }}</span>
      </div>

      <form @submit.prevent="updateEvent" class="event-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Título</label>
            <input v-model="form.titulo" :disabled="isClosed" type="text" :class="{ 'error-border': errors.titulo }">
            <span v-if="errors.titulo" class="form-error">{{ errors.titulo }}</span>
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="form.tipo_evento" :disabled="isClosed">
              <option value="social">Social</option>
              <option value="deportivo">Deportivo</option>
              <option value="torneo">Torneo</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label>Descripción</label>
            <textarea v-model="form.descripcion" :disabled="isClosed" rows="2" :class="{ 'error-border': errors.descripcion }"></textarea>
            <span v-if="errors.descripcion" class="form-error">{{ errors.descripcion }}</span>
          </div>
          <div class="form-group">
            <label>Fecha Evento</label>
            <input v-model="form.fecha_evento" :disabled="isClosed" type="date" :class="{ 'error-border': errors.fecha_evento }">
            <span v-if="errors.fecha_evento" class="form-error">{{ errors.fecha_evento }}</span>
          </div>
          <div class="form-group">
            <label>Fecha Límite Pago</label>
            <input v-model="form.fecha_limite_pago" :disabled="isClosed" type="date" :class="{ 'error-border': errors.fecha_limite_pago }">
            <span v-if="errors.fecha_limite_pago" class="form-error">{{ errors.fecha_limite_pago }}</span>
          </div>
          <div class="form-group">
            <label>Costo Unitario</label>
            <input v-model.number="form.costo_unitario" :disabled="isClosed" type="number" :class="{ 'error-border': errors.costo_unitario }">
            <span v-if="errors.costo_unitario" class="form-error">{{ errors.costo_unitario }}</span>
          </div>
        </div>
        
        <div class="form-actions" v-if="!isClosed">
          <button type="submit" class="btn btn-primary" :disabled="updating">
            {{ updating ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Financial Summary -->
    <div class="summary-cards">
      <div class="summary-card income">
        <h3>Total Recaudado</h3>
        <p class="amount">{{ formatCurrency(event.resumen?.total_pagado || 0) }}</p>
      </div>
      <div class="summary-card pending">
        <h3>Pendiente</h3>
        <p class="amount">{{ formatCurrency(event.resumen?.total_pendiente || 0) }}</p>
      </div>
    </div>

    <!-- Players List -->
    <div class="players-section">
      <div class="section-header">
        <h3>Jugadores Inscritos ({{ event.jugadores?.length || 0 }})</h3>
        <button v-if="!isClosed" class="btn btn-primary" @click="openAddPlayerModal">
          ➕ Agregar Jugador
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Estado Pago</th>
              <th>Monto</th>
              <th>Cumplimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in event.jugadores" :key="player.jugador_id">
              <td>{{ player.numero_jugador }}</td>
              <td>{{ player.nombre }}</td>
              <td>
                <span :class="['payment-badge', player.estado_pago]">
                  {{ player.estado_pago }}
                </span>
              </td>
              <td>{{ formatCurrency(player.monto) }}</td>
              <td>
                <span v-if="player.estado_pago === 'pagado'" :class="['compliance-badge', player.estado_cumplimiento]">
                  {{ player.estado_cumplimiento === 'a_tiempo' ? 'A Tiempo' : 'atrasado' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="actions-cell">
                <button 
                  v-if="player.estado_pago === 'pendiente'"
                  class="btn-icon pay" 
                  title="Registrar Pago"
                  @click="openPayModal(player)"
                >
                  💰
                </button>
                <button 
                  v-if="!isClosed"
                  class="btn-icon delete" 
                  title="Eliminar"
                  @click="removePlayer(player.jugador_id)"
                >
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="!event.jugadores?.length">
              <td colspan="6" class="text-center">No hay jugadores inscritos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <!-- Add Player Modal -->
    <div v-if="showAddPlayerModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Agregar Jugador</h3>
        <div class="search-box">
          <input 
            v-model="playerSearch" 
            placeholder="Buscar por nombre o RUT..." 
            class="search-input"
            autofocus
          >
          <div v-if="searchLoading" class="search-loader">Buscando...</div>
        </div>
        <div class="players-list">
          <div v-if="searchResults.length === 0 && !searchLoading && playerSearch.length >= 2" class="no-results">
            No se encontraron jugadores
          </div>
          <div 
            v-for="p in searchResults" 
            :key="p.id" 
            class="player-item"
            @click="selectPlayer(p)"
          >
            <div class="player-info">
              <span class="player-name">{{ p.nombre_completo }}</span>
              <span class="player-rut">{{ p.rut }}</span>
            </div>
            <span class="add-icon">➕</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-text" @click="showAddPlayerModal = false">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Confirm Add Player -->
    <div v-if="selectedPlayer" class="modal-overlay">
      <div class="modal-content small">
        <h3>Inscribir a :</h3>
        <h4>{{ selectedPlayer.nombre_completo }}</h4>
        <div class="form-group">
          <label>Número Camiseta (Opcional)</label>
          <input v-model="newPlayerNumber" type="number">
        </div>
        <div class="modal-actions">
          <button class="btn btn-text" @click="selectedPlayer = null">Cancelar</button>
          <button class="btn btn-primary" @click="confirmAddPlayer">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- Pay Modal -->
    <div v-if="payModal.show" class="modal-overlay">
      <div class="modal-content small">
        <h3>Registrar Pago</h3>
        <p>Jugador: {{ payModal.player?.nombre }}</p>
        <p>Monto: {{ formatCurrency(payModal.player?.monto) }}</p>
        
        <div class="form-group">
          <label>Fecha de Pago</label>
          <input v-model="payModal.date" type="datetime-local">
        </div>

        <div class="modal-actions">
          <button class="btn btn-text" @click="closePayModal">Cancelar</button>
          <button class="btn btn-success" @click="confirmPayment">Registrar</button>
        </div>
      </div>
    </div>

    <!-- Confirm Action Modal -->
    <div v-if="confirmation.show" class="modal-overlay">
      <div class="modal-content small">
        <h3>Confirmación</h3>
        <p>{{ confirmation.message }}</p>
        <div class="modal-actions">
          <button class="btn btn-text" @click="confirmation.show = false">Cancelar</button>
          <button class="btn btn-primary" @click="executeConfirmation">Confirmar</button>
        </div>
      </div>
    </div>

  </div>
  <div v-else class="loading-view">Cargando...</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClubStore } from '../stores/club';
import { eventsAPI, playersAPI } from '../api';

const route = useRoute();
const router = useRouter();
const clubStore = useClubStore();

const event = ref(null);
const searchResults = ref([]);
const searchLoading = ref(false);
const loading = ref(true);
const updating = ref(false);
const notification = ref(null);
const confirmation = ref({
  show: false,
  message: '',
  action: null
});

// Forms
const form = ref({});
const errors = reactive({
  titulo: '',
  fecha_evento: '',
  fecha_limite_pago: '',
  costo_unitario: '',
  descripcion: ''
});

const validateForm = () => {
  let isValid = true;
  Object.keys(errors).forEach(key => errors[key] = '');

  // Nombre Evento (Título)
  if (!form.value.titulo || !form.value.titulo.trim()) {
    errors.titulo = 'El nombre del evento es obligatorio';
    isValid = false;
  } else if (!/^[a-zA-Z0-9\s\u00C0-\u00FF]+$/.test(form.value.titulo)) {
    errors.titulo = 'Solo se permiten letras, espacios y números';
    isValid = false;
  }

  // Fecha Evento
  if (!form.value.fecha_evento) {
    errors.fecha_evento = 'La fecha del evento es obligatoria';
    isValid = false;
  } else if (isNaN(new Date(form.value.fecha_evento).getTime())) {
    errors.fecha_evento = 'Fecha inválida';
    isValid = false;
  }

  // Fecha Límite Pago
  if (!form.value.fecha_limite_pago) {
    errors.fecha_limite_pago = 'La fecha límite de pago es obligatoria';
    isValid = false;
  } else {
    const fechaLimite = new Date(form.value.fecha_limite_pago);
    const fechaEvento = new Date(form.value.fecha_evento);
    
    if (isNaN(fechaLimite.getTime())) {
      errors.fecha_limite_pago = 'Fecha inválida';
      isValid = false;
    } else if (form.value.fecha_evento && fechaLimite < fechaEvento) {
      errors.fecha_limite_pago = 'La fecha límite no puede ser inferior a la fecha del evento';
      isValid = false;
    }
  }

  // Costo Unitario
  if (form.value.costo_unitario === null || form.value.costo_unitario === '') {
     // Optional check if required by business logic, assuming yes based on prompt context
     errors.costo_unitario = 'El costo es obligatorio';
     isValid = false;
  } else if (!Number.isInteger(Number(form.value.costo_unitario)) || Number(form.value.costo_unitario) <= 0) {
    errors.costo_unitario = 'Debe ser un número entero positivo';
    isValid = false;
  }

  // Descripción
  if (form.value.descripcion && form.value.descripcion.length > 255) {
    errors.descripcion = 'La descripción no puede exceder 255 caracteres';
    isValid = false;
  } else if (form.value.descripcion && !/^[a-zA-Z0-9\s\u00C0-\u00FF]+$/.test(form.value.descripcion)) {
    errors.descripcion = 'Solo se permiten letras, espacios, números y tildes';
    isValid = false;
  }

  return isValid;
};

const playerSearch = ref('');
const showAddPlayerModal = ref(false);
const selectedPlayer = ref(null);
const newPlayerNumber = ref(null);

const payModal = ref({
  show: false,
  player: null,
  date: ''
});

const clubId = computed(() => clubStore.selectedClub.value?.id);
const isClosed = computed(() => event.value?.estado === 'cerrado');

// Fetch Data
const loadEvent = async () => {
  if (!clubId.value) return;
  try {
    const res = await eventsAPI.getById(clubId.value, route.params.id);
    event.value = res.data;
    // Populate form
    form.value = { ...res.data };
    // Format dates for input
    if (form.value.fecha_evento) form.value.fecha_evento = form.value.fecha_evento.split('T')[0];
    if (form.value.fecha_limite_pago) form.value.fecha_limite_pago = form.value.fecha_limite_pago.split('T')[0];
  } catch (err) {
    console.error(err);
    showNotification('error', 'Error al cargar evento');
  }
};

// Search Players
let searchTimeout;
watch(playerSearch, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  if (!newVal || newVal.length < 2) {
    searchResults.value = [];
    return;
  }
  
  searchLoading.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const res = await playersAPI.search(clubId.value, newVal);
      searchResults.value = res.data;
    } catch (err) {
      console.error(err);
    } finally {
      searchLoading.value = false;
    }
  }, 300); // 300ms debounce
});

// Actions
const updateEvent = async () => {
  if (!validateForm()) {
    showNotification('error', 'Por favor corrija los errores en el formulario');
    return;
  }
  
  updating.value = true;
  try {
    await eventsAPI.update(clubId.value, event.value.id, form.value);
    await loadEvent();
    showNotification('success', 'Evento actualizado');
  } catch (err) {
    console.error(err);
    showNotification('error', 'Error al actualizar');
  } finally {
    updating.value = false;
  }
};

const changeStatus = (status) => {
  confirmAction(`¿Seguro que deseas cambiar el estado a ${status}?`, async () => {
    try {
      await eventsAPI.update(clubId.value, event.value.id, { estado: status });
      await loadEvent();
      showNotification('success', `Estado cambiado a ${status}`);
    } catch (err) {
      showNotification('error', 'Error al cambiar estado');
    }
  });
};

const confirmClose = () => {
  confirmAction('¿Seguro que deseas CERRAR este evento? Esto generará los movimientos financieros y no se puede deshacer.', async () => {
    try {
      await eventsAPI.close(clubId.value, event.value.id);
      await loadEvent();
      showNotification('success', 'Evento cerrado exitosamente');
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Error al cerrar evento');
    }
  });
};

// Player Management
const openAddPlayerModal = () => {
  playerSearch.value = '';
  searchResults.value = [];
  showAddPlayerModal.value = true;
};

const selectPlayer = (player) => {
  selectedPlayer.value = player;
  newPlayerNumber.value = player.folio || null;
  showAddPlayerModal.value = false;
};

const confirmAddPlayer = async () => {
  try {
    await eventsAPI.addPlayer(clubId.value, event.value.id, {
      jugador_id: selectedPlayer.value.id,
      numero_jugador: newPlayerNumber.value
    });
    selectedPlayer.value = null;
    await loadEvent(); // Refresh list
    showNotification('success', 'Jugador agregado');
  } catch (err) {
    showNotification('error', err.response?.data?.message || 'Error al agregar jugador');
  }
};

const removePlayer = (playerId) => {
  confirmAction('¿Quitar jugador del evento?', async () => {
    try {
      await eventsAPI.removePlayer(clubId.value, event.value.id, playerId);
      await loadEvent();
      showNotification('success', 'Jugador eliminado del evento');
    } catch (err) {
      showNotification('error', 'Error al eliminar');
    }
  });
};

// Payment
const openPayModal = (player) => {
  payModal.value = {
    show: true,
    player,
    date: new Date().toISOString().slice(0, 16) // Current time for input datetime-local
  };
};

const closePayModal = () => {
  payModal.value = { show: false, player: null, date: '' };
};

const confirmPayment = async () => {
  try {
    await eventsAPI.registerPayment(
      clubId.value, 
      event.value.id, 
      payModal.value.player.jugador_id, 
      { fecha_pago: new Date(payModal.value.date).toISOString() }
    );
    closePayModal();
    loadEvent();
    showNotification('success', 'Pago registrado correctamente');
  } catch (err) {
    showNotification('error', 'Error al registrar pago');
  }
};

// Notifications
const showNotification = (type, message) => {
  notification.value = { type, message };
  setTimeout(() => notification.value = null, 5000);
};

const confirmAction = (message, action) => {
  confirmation.value = { show: true, message, action };
};

const executeConfirmation = async () => {
  if (confirmation.value.action) {
    await confirmation.value.action();
  }
  confirmation.value = { show: false, message: '', action: null };
};

// Utils
const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

onMounted(async () => {
  loading.value = true;
  if (clubId.value) {
    await loadEvent();
  }
  loading.value = false;
});
</script>

<style scoped>
.event-detail-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--primary-light);
}

.actions {
  display: flex;
  gap: 1rem;
}

.info-card {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
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
  color: var(--text-primary);
  font-size: 1rem;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

input:disabled, select:disabled, textarea:disabled {
  background: var(--bg-primary);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.7;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--bg-card);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.summary-card.income .amount { color: var(--accent-green); }
.summary-card.pending .amount { color: var(--accent-red); }

.amount {
  font-size: 2rem;
  font-weight: bold;
  margin: 0.5rem 0 0;
}

.players-section {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 1rem;
  color: var(--text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
}

td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}

tr:last-child td {
  border-bottom: none;
}

.payment-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  text-transform: capitalize;
  font-weight: 500;
}
.payment-badge.pagado { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
.payment-badge.pendiente { background: rgba(245, 158, 11, 0.1); color: var(--accent-orange); }

.compliance-badge {
  font-weight: bold;
}
.compliance-badge.a_tiempo { color: var(--accent-green); }
.compliance-badge.tardio { color: var(--accent-red); }

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
}

/* Modal styles similar to Events.vue */
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

.modal-content.small {
  max-width: 400px;
}

.search-box {
  position: relative;
}

.search-loader {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.players-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-top: 1rem;
  background: var(--bg-tertiary);
}

.no-results {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.player-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-primary);
  transition: background 0.2s;
}

.player-item:hover {
  background: var(--bg-hover);
}

.player-info {
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: 500;
}

.player-rut {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.add-icon {
  font-size: 1.2rem;
  color: var(--primary-light);
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
}

.player-item:hover .add-icon {
  opacity: 1;
  transform: scale(1.1);
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary { 
  background: var(--primary-gradient);
  box-shadow: var(--shadow-md);
}
.btn-primary:hover:not(:disabled) { 
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-success { background: var(--accent-green); }
.btn-success:hover:not(:disabled) { opacity: 0.9; }

.btn-danger { background: var(--accent-red); }
.btn-danger:hover:not(:disabled) { opacity: 0.9; }

.btn-text { background: none; color: var(--text-muted); }
.btn-text:hover { color: var(--text-primary); }

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  text-transform: capitalize;
  font-weight: bold;
}
.status-badge.borrador { background: var(--bg-tertiary); color: var(--text-muted); }
.status-badge.abierto { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
.status-badge.cerrado { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }

.alert {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.close-alert {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.5rem;
}
</style>
