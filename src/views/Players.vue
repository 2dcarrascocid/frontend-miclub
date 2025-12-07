<template>
  <div class="players-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>👥 Jugadores</h1>
          <p>Gestiona tu equipo de jugadores</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedClubId" class="club-select" @change="resetAndLoad">
            <option value="" disabled>Selecciona un club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.nombre }}
            </option>
          </select>
          <button class="btn btn-primary" @click="openCreateModal" :disabled="!selectedClubId">
            ➕ Nuevo Jugador
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando jugadores...</p>
      </div>

      <!-- No Club Selected -->
      <div v-else-if="!selectedClubId" class="empty-state">
        <span class="empty-icon">👆</span>
        <h3>Selecciona un club</h3>
        <p>Elige un club para ver sus jugadores</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="players.length === 0 && !loading" class="empty-state">
        <span class="empty-icon">👥</span>
        <h3>No hay jugadores</h3>
        <p>Agrega jugadores a tu club para comenzar</p>
        <button class="btn btn-primary" @click="openCreateModal">
          Agregar Primer Jugador
        </button>
      </div>

      <!-- Players Table -->
      <div v-else class="players-table-container">
        <table class="players-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Nombre Completo</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Edad</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in players" :key="player.id">
              <td>{{ player.folio || '-' }}</td>
              <td>
                <div class="player-name-cell">
                  <div class="player-avatar-small">
                    {{ getInitials(player.nombre_completo) }}
                  </div>
                  {{ player.nombre_completo }}
                </div>
              </td>
              <td>{{ player.rut || '-' }}</td>
              <td>{{ player.telefono || '-' }}</td>
              <td>{{ calculateAge(player.fecha_nacimiento) }}</td>
              <td>
                <span :class="['badge', getCategoryClass(player.fecha_nacimiento)]">
                  {{ getCategory(player.fecha_nacimiento) }}
                </span>
              </td>
              <td>
                <div class="status-icons">
                  <span v-if="player.es_socio" title="Socio">⭐</span>
                  <span v-if="player.es_jugador" title="Jugador">⚽</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="editPlayer(player)" title="Editar">✏️</button>
                  <button class="btn-icon delete" @click="deletePlayer(player.id)" title="Eliminar">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPlayers > 0">
          <button 
            class="btn-page" 
            :disabled="currentPage === 1" 
            @click="prevPage"
          >
            Anterior
          </button>
          <span class="page-info">Página {{ currentPage }} (Total: {{ totalPlayers }})</span>
          <button 
            class="btn-page" 
            :disabled="!hasNextPage" 
            @click="nextPage"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar Jugador' : 'Nuevo Jugador' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre Completo *</label>
            <input 
              type="text" 
              v-model="form.nombre_completo" 
              placeholder="Ej: Alexis Sánchez"
              required
              class="form-input"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>RUT</label>
              <input 
                type="text" 
                v-model="form.rut" 
                placeholder="12.345.678-9"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>Fecha de Nacimiento</label>
              <input 
                type="date" 
                v-model="form.fecha_nacimiento" 
                class="form-input"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                v-model="form.email" 
                placeholder="jugador@email.com"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input 
                type="tel" 
                v-model="form.telefono" 
                placeholder="+56 9 1234 5678"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group checkboxes">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="form.es_socio"
              >
              <span>⭐ Es Socio</span>
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="form.es_jugador"
              >
              <span>⚽ Es Jugador</span>
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { clubsAPI, playersAPI } from '../api';

const route = useRoute();
const authStore = useAuthStore();
const clubStore = useClubStore();

const clubs = ref([]);
const players = ref([]);
const selectedClubId = ref('');
const loading = ref(false);
const showCreateModal = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

// Pagination State
const currentPage = ref(1);
const totalPlayers = ref(0);
const pageTokens = ref([null]); // Index 0 is for Page 1 (no token)
const hasNextPage = ref(false);

const form = reactive({
  nombre_completo: '',
  rut: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  es_socio: false,
  es_jugador: false,
  usuario_id: null
});

onMounted(async () => {
  await loadClubs();
  
  if (route.query.club) {
    selectedClubId.value = route.query.club;
  } else if (clubStore.selectedClub.value) {
    selectedClubId.value = clubStore.selectedClub.value.id;
  } else if (clubs.value.length > 0) {
    selectedClubId.value = clubs.value[0].id;
  }
  
  if (selectedClubId.value) {
    await loadPlayers();
  }
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

const resetAndLoad = () => {
  currentPage.value = 1;
  pageTokens.value = [null];
  loadPlayers();
};

const loadPlayers = async () => {
  if (!selectedClubId.value) return;
  
  loading.value = true;
  try {
    // Get token for current page (index is currentPage - 1)
    const nextToken = pageTokens.value[currentPage.value - 1];
    
    const params = {};
    if (nextToken) {
      params.next = nextToken;
    }

    const response = await playersAPI.getAll(selectedClubId.value, params);
    
    // Handle new response format
    const { data, total_jugadores, next } = response.data;
    
    players.value = Array.isArray(data) ? data : [];
    totalPlayers.value = total_jugadores || 0;
    
    // Store next token for the NEXT page (index is currentPage)
    if (next) {
      pageTokens.value[currentPage.value] = next;
      hasNextPage.value = true;
    } else {
      hasNextPage.value = false;
    }

  } catch (error) {
    console.error('Error loading players:', error);
    players.value = [];
  } finally {
    loading.value = false;
  }
};

const nextPage = () => {
  if (hasNextPage.value) {
    currentPage.value++;
    loadPlayers();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadPlayers();
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const playerData = { ...form };

    if (isEditing.value) {
      await playersAPI.update({ ...playerData, id: editingId.value });
    } else {
      await playersAPI.create(selectedClubId.value, playerData);
    }

    // Reload current page to see changes
    await loadPlayers();
    closeModal();
  } catch (error) {
    console.error('Error saving player:', error);
    alert('Error al guardar el jugador');
  } finally {
    submitting.value = false;
  }
};

const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const editPlayer = (player) => {
  isEditing.value = true;
  editingId.value = player.id;
  form.nombre_completo = player.nombre_completo;
  form.rut = player.rut;
  form.email = player.email;
  form.telefono = player.telefono;
  form.fecha_nacimiento = player.fecha_nacimiento;
  form.es_socio = player.es_socio;
  form.es_jugador = player.es_jugador;
  form.usuario_id = player.usuario_id;
  showCreateModal.value = true;
};

const deletePlayer = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este jugador?')) return;
  
  try {
    await playersAPI.delete(id);
    await loadPlayers();
  } catch (error) {
    console.error('Error deleting player:', error);
    alert('Error al eliminar el jugador');
  }
};

const closeModal = () => {
  showCreateModal = false;
  resetForm();
};

const resetForm = () => {
  isEditing.value = false;
  editingId.value = null;
  form.nombre_completo = '';
  form.rut = '';
  form.email = '';
  form.telefono = '';
  form.fecha_nacimiento = '';
  form.es_socio = false;
  form.es_jugador = false;
  form.usuario_id = null;
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '-';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getCategory = (birthDate) => {
  const age = calculateAge(birthDate);
  if (age === '-') return '';
  
  // Logic:
  // 35-45: Senior
  // 46-54: Super Senior
  // >= 55: Dorado
  
  if (age >= 55) return 'Dorado';
  if (age > 45) return 'Super Senior';
  if (age >= 35) return 'Senior';
  return '';
};

const getCategoryClass = (birthDate) => {
  const category = getCategory(birthDate);
  if (category === 'Senior') return 'badge-senior';
  if (category === 'Super Senior') return 'badge-super';
  if (category === 'Dorado') return 'badge-dorado';
  return '';
};
</script>

<style scoped>
.players-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
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

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.club-select {
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  min-width: 200px;
}

/* Table Styles */
.players-table-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-primary);
}

.players-table th,
.players-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.players-table th {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.players-table tr:last-child td {
  border-bottom: none;
}

.players-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.player-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
}

.player-avatar-small {
  width: 32px;
  height: 32px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
}

.status-icons {
  display: flex;
  gap: 0.5rem;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  padding: 0.25rem;
}

.btn-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* Badges */
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.badge-senior {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-super {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.badge-dorado {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn-page {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page:not(:disabled):hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--text-muted);
  cursor: pointer;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}

.checkboxes {
  display: flex;
  gap: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .club-select {
    width: 100%;
  }
  
  .players-table-container {
    overflow-x: auto;
  }
}
</style>
