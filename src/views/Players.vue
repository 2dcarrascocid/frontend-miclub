<template>
  <div class="players-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h2 class="inline">👥</h2>
          <h1 class="inline">Jugadores</h1>
          <p>Gestiona tu equipo de jugadores</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedClubId" class="club-select">
            <option value="" disabled>Selecciona un club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.nombre }}
            </option>
          </select>
          <button class="btn btn-secondary" @click="showBatchUpload = true" :disabled="!selectedClubId" style="margin-right: 0.5rem;">
            📄 Carga Masiva
          </button>
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

      <div v-else>
        <!-- Category Tabs -->
        <div class="category-tabs">
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            :class="['tab-btn', { active: selectedCategory === cat.id }]"
            @click="setCategory(cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Búsqueda -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            v-model="busqueda"
            @input="onBusquedaInput"
            placeholder="Buscar por nombre o RUT..."
            class="search-input"
          />
          <button v-if="busqueda" class="search-clear" @click="busqueda = ''; resetAndLoad()">✕</button>
        </div>

        <!-- Empty State -->
        <div v-if="players.length === 0 && !loading" class="empty-state">
          <span class="empty-icon">👥</span>
          <h3>No hay jugadores</h3>
          <p>{{ getEmptyMessage() }}</p>
          <button v-if="selectedCategory === 'todos'" class="btn btn-primary" @click="openCreateModal">
            Agregar Primer Jugador
          </button>
        </div>

        <!-- Players Content -->
        <div v-else class="players-content">
          
          <!-- Desktop Table -->
          <div class="table-responsive desktop-only">
            <table class="players-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Nombre Completo</th>
                  <th>RUT</th>
                  <th>Teléfono</th>
                  <th>Edad</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in players" :key="player.id">
                  <td>{{ player.folio || '-' }}</td>
                  <td>
                    <div class="player-name-cell">
                      <div class="player-avatar-small">
                        <img v-if="player.path_foto" :src="getThumbnailUrl(player.path_foto)" :alt="getInitials(player.nombre_completo)" class="avatar-img" />
                        <span v-else>{{ getInitials(player.nombre_completo) }}</span>
                      </div>
                      {{ player.nombre_completo }}
                    </div>
                  </td>
                  <td>{{ player.rut || '-' }}</td>
                  <td>{{ player.telefono || '-' }}</td>
                  <td>{{ calculateAge(player.fecha_nacimiento) }}</td>
                  <td>
                    <span class="badge" :style="getCategoryStyle(player.fecha_nacimiento)">
                      {{ getCategoryName(player.fecha_nacimiento) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" @click="editPlayer(player)" title="Editar">✏️</button>
                      <button class="btn-icon" @click="viewPlayer(player)" title="Ver Detalle">👤</button>
                      <button
                        v-if="selectedCategory !== 'eliminados'"
                        class="btn-icon btn-danger"
                        @click="deletePlayer(player.id)"
                        title="Eliminar jugador"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-only mobile-cards">
            <div v-for="player in players" :key="player.id" class="player-card">
              <div class="player-card-header">
                <div class="player-name-cell">
                  <div class="player-avatar-small">
                    <img v-if="player.path_foto" :src="getThumbnailUrl(player.path_foto)" :alt="getInitials(player.nombre_completo)" class="avatar-img" />
                    <span v-else>{{ getInitials(player.nombre_completo) }}</span>
                  </div>
                  <span class="player-name">{{ player.nombre_completo }}</span>
                </div>
                <div class="action-buttons">
                  <button class="btn-icon" @click="editPlayer(player)" title="Editar Jugador">✏️</button>
                  <button class="btn-icon" @click="viewPlayer(player)" title="Ver Detalle">👤</button>
                  <button
                    v-if="selectedCategory !== 'eliminados'"
                    class="btn-icon btn-danger"
                    @click="deletePlayer(player.id)"
                    title="Eliminar jugador"
                  >🗑️</button>
                </div>
              </div>
              
              <div class="player-card-body">
                <div class="card-row">
                  <span class="label">Folio:</span>
                  <span class="value">{{ player.folio || '-' }}</span>
                </div>
                <div class="card-row">
                  <span class="label">RUT:</span>
                  <span class="value">{{ player.rut || '-' }}</span>
                </div>
                <div class="card-row">
                  <span class="label">Edad:</span>
                  <span class="value">{{ calculateAge(player.fecha_nacimiento) }} años</span>
                </div>
                <div class="card-row">
                  <span class="label">Categoría:</span>
                  <span class="badge" :style="getCategoryStyle(player.fecha_nacimiento)">
                    {{ getCategoryName(player.fecha_nacimiento) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
<div
  v-if="showCreateModal"
  class="modal-overlay"
  @click="closeModal"
>
  <div
    class="modal-content"
    @click.stop
  >
    <!-- HEADER -->
    <div class="modal-header">
      <h2>{{ isEditing ? 'Editar Jugador' : 'Nuevo Jugador' }}</h2>
      <button
        type="button"
        class="close-btn"
        @click="closeModal"
        aria-label="Cerrar modal"
      >
        ×
      </button>
    </div>

    <!-- FORM -->
    <form @submit.prevent="handleSubmit">
      <!-- Foto -->
      <div class="form-group photo-upload-group">
        <label>Foto del Jugador</label>
        <div class="photo-upload-area" @click="triggerFileInput">
          <div class="photo-preview">
            <img v-if="photoPreview" :src="photoPreview" alt="Vista previa" class="photo-preview-img" />
            <span v-else class="photo-placeholder">📷</span>
          </div>
          <div class="photo-upload-info">
            <span v-if="uploadingPhoto" class="upload-status">Subiendo... {{ uploadProgress }}%</span>
            <span v-else-if="photoPreview" class="upload-status change">Clic para cambiar foto</span>
            <span v-else class="upload-status">Clic para adjuntar imagen</span>
            <small>JPG, PNG — máx. 5MB</small>
          </div>
        </div>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden-file-input"
          @change="onFileSelected"
        />
        <span v-if="errors.photo" class="error-message">{{ errors.photo }}</span>
      </div>

      <!-- Nombre -->
      <div class="form-group">
        <label>Nombre Completo *</label>
        <input
          type="text"
          v-model="form.nombre_completo"
          placeholder="Ej: Alexis Sánchez"
          required
          class="form-input"
          :class="{ 'input-error': errors.nombre_completo }"
        />
        <span v-if="errors.nombre_completo" class="error-message">{{ errors.nombre_completo }}</span>
      </div>

      <!-- Folio — solo editable al modificar, auto-asignado al crear -->
      <div class="form-group" v-if="isEditing">
        <label>Folio</label>
        <input
          type="number"
          v-model.number="form.folio"
          placeholder="Ej: 123"
          min="1"
          class="form-input"
        />
      </div>
      <div class="form-group" v-else>
        <label>Folio</label>
        <input type="text" value="Se asigna automáticamente" class="form-input" disabled />
      </div>

      <!-- RUT + Fecha -->
      <div class="form-row">
        <div class="form-group">
          <label>RUT</label>
          <input
            type="text"
            v-model="form.rut"
            placeholder="12345678-9"
            class="form-input"
            :class="{ 'input-error': errors.rut }"
          />
          <span v-if="errors.rut" class="error-message">{{ errors.rut }}</span>
        </div>

        <div class="form-group">
          <label>Fecha de Nacimiento</label>
          <input
            type="date"
            v-model="form.fecha_nacimiento"
            class="form-input"
            :class="{ 'input-error': errors.fecha_nacimiento }"
          />
          <span v-if="errors.fecha_nacimiento" class="error-message">{{ errors.fecha_nacimiento }}</span>
        </div>
      </div>

      <!-- Email + Teléfono -->
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input
            type="email"
            v-model="form.email"
            placeholder="jugador@email.com"
            class="form-input"
            :class="{ 'input-error': errors.email }"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input
            type="tel"
            v-model="form.telefono"
            placeholder="+56 9 1234-5678"
            class="form-input"
            :class="{ 'input-error': errors.telefono }"
          />
          <span v-if="errors.telefono" class="error-message">{{ errors.telefono }}</span>
        </div>
      </div>

      <!-- ACCIONES -->
      <div class="form-actions">
        <button
          type="button"
          class="btn btn-outline"
          @click="closeModal"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
        </button>
      </div>
    </form>
  </div>
</div>

    </div>
    <BatchPlayerUpload 
      v-if="showBatchUpload" 
      :clubId="selectedClubId" 
      @close="showBatchUpload = false"
      @success="() => { showBatchUpload = false; loadPlayers(); }"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { clubsAPI, playersAPI, categoriesAPI } from '../api';
import BatchPlayerUpload from './../components/players/BatchPlayerUpload.vue';
import { useCloudinary } from '../composables/useCloudinary.js';

const { getThumbnailUrl, uploadImage } = useCloudinary();

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const clubStore = useClubStore();

const clubs = ref([]);
const players = ref([]);
const selectedClubId = ref('');
const loading = ref(false);
const showCreateModal = ref(false);
const showBatchUpload = ref(false);
const submitting = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

// Photo upload
const fileInputRef = ref(null);
const photoFile = ref(null);
const photoPreview = ref('');
const uploadingPhoto = ref(false);
const uploadProgress = ref(0);

// Búsqueda
const busqueda = ref('');
let debounceTimer = null;

const onBusquedaInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    resetAndLoad();
  }, 400);
};

onUnmounted(() => clearTimeout(debounceTimer));

// Categories
const categories = ref([
  { id: 'todos', label: 'Todos' }
]);
const selectedCategory = ref('todos');

// Watch selectedClubId to load categories
watch(selectedClubId, async (newId) => {
  if (newId) {
    await loadCategories(newId);
    resetAndLoad();
  }
});

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
  usuario_id: null,
  folio: null,
  path_foto: ''
});

const errors = reactive({
  nombre_completo: '',
  rut: '',
  telefono: '',
  fecha_nacimiento: '',
  folio: '',
  email: '',
  photo: ''
});

const validateRut = (rut) => {
  if (!rut) return false;
  // Limpiar puntos y guión para validación flexible si se quisiera, pero el usuario pidió "números y guion"
  // El regex /^[0-9]+-[0-9kK]{1}$/ fuerza el formato sin puntos.
  if (!/^[0-9]+-[0-9kK]{1}$/.test(rut)) return false;
  
  const [body, dv] = rut.split('-');
  let suma = 0;
  let multiplo = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(body.charAt(i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = (dvEsperado === 11) ? '0' : ((dvEsperado === 10) ? 'k' : dvEsperado.toString());
  
  return dvCalculado === dv.toLowerCase();
};

const validateForm = () => {
  let isValid = true;
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '');

  // Nombre Completo: no vacio, solo letras y espacios
  if (!form.nombre_completo.trim()) {
    errors.nombre_completo = 'El nombre es obligatorio';
    isValid = false;
  } else if (!/^[a-zA-Z\s\u00C0-\u00FF]+$/.test(form.nombre_completo)) {
     errors.nombre_completo = 'Solo se permiten letras y espacios';
     isValid = false;
  }

  // RUT: no vacio, numeros y guion, validacion chileno
  if (!form.rut.trim()) {
    errors.rut = 'El RUT es obligatorio';
    isValid = false;
  } else if (!validateRut(form.rut)) {
    errors.rut = 'RUT inválido (Ej: 12345678-9)';
    isValid = false;
  }

  // Telefono: no vacio, solo numeros y guion
  if (!form.telefono.trim()) {
    errors.telefono = 'El teléfono es obligatorio';
    isValid = false;
  } else if (!/^[0-9-]+$/.test(form.telefono)) {
    errors.telefono = 'Solo se permiten números y guiones';
    isValid = false;
  }

  // Fecha Nacimiento: no vacio, fecha valida, no futura
  if (!form.fecha_nacimiento) {
    errors.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    isValid = false;
  } else {
     const date = new Date(form.fecha_nacimiento);
     const today = new Date();
     // Reset hours to compare just dates if needed, or just compare objects
     today.setHours(0, 0, 0, 0);
     
     if (isNaN(date.getTime())) {
        errors.fecha_nacimiento = 'Fecha inválida';
        isValid = false;
     } else if (date > today) {
        errors.fecha_nacimiento = 'La fecha no puede ser futura';
        isValid = false;
     }
  }

  // Email: validación de formato si existe
  if (form.email && form.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      errors.email = 'Formato de correo inválido';
      isValid = false;
    }
  }

  // Folio: solo validar si está editando y se ingresó un valor
  if (isEditing.value && form.folio !== null && form.folio !== '') {
    if (!Number.isInteger(form.folio) || form.folio <= 0) {
      errors.folio = 'Debe ser un número entero mayor que cero';
      isValid = false;
    }
  }

  return isValid;
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
  // The watch will trigger loadCategories and loadPlayers
});

const loadCategories = async (clubId) => {
  try {
    const res = await categoriesAPI.getAll(clubId);
    const apiCats = res.data || [];
    
    // Map to format used in template
    const mappedCats = apiCats.map(c => ({
      id: c.id, // Keep ID for filtering logic
      label: `${c.nombre} (${c.edad_desde}-${c.edad_hasta})`,
      nombre: c.nombre,
      edad_desde: c.edad_desde,
      edad_hasta: c.edad_hasta,
      color: c.color,
      border: c.border,
      background: c.background
    }));

    categories.value = [
      { id: 'todos', label: 'Todos' },
      ...mappedCats,
      { id: 'eliminados', label: 'Eliminados' }
    ];
  } catch (error) {
    console.error('Error loading categories:', error);
    // Fallback?
  }
};

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

const setCategory = (catId) => {
  selectedCategory.value = catId;
  resetAndLoad();
};

const getEmptyMessage = () => {
  if (selectedCategory.value === 'todos') return 'Agrega jugadores a tu club para comenzar';
  if (selectedCategory.value === 'eliminados') return 'No hay jugadores eliminados';
  const label = categories.value.find(c => c.id === selectedCategory.value)?.label;
  return `No hay jugadores en la categoría ${label}`;
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
    
    if (selectedCategory.value !== 'todos') {
      params.categoria = selectedCategory.value;
    }

    if (busqueda.value.trim()) {
      params.busqueda = busqueda.value.trim();
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

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const onFileSelected = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  errors.photo = '';

  if (file.size > 5 * 1024 * 1024) {
    errors.photo = 'La imagen no puede superar 5MB';
    return;
  }

  photoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  submitting.value = true;

  try {
    // Subir foto si hay una nueva seleccionada
    if (photoFile.value) {
      uploadingPhoto.value = true;
      uploadProgress.value = 0;
      try {
        form.path_foto = await uploadImage(photoFile.value, (pct) => {
          uploadProgress.value = pct;
        });
      } finally {
        uploadingPhoto.value = false;
      }
    }

    const playerData = { ...form };

    if (isEditing.value) {
      await playersAPI.update(
        selectedClubId.value,
        editingId.value,
        playerData
      );
    } else {
      await playersAPI.create(selectedClubId.value, playerData);
    }

    // 🔄 RESET + REFRESH
    currentPage.value = 1;
    pageTokens.value = [null];
    hasNextPage.value = false;

    await loadPlayers();   // recarga jugadores
    closeModal();          // cierra modal

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
  form.es_jugador = player.es_jugador;
  form.path_foto = player.path_foto || '';
  photoPreview.value = player.path_foto || '';
  photoFile.value = null;
  showCreateModal.value = true;
};

const deletePlayer = async (id) => {
  if (!confirm('¿Eliminar jugador? Su folio quedará disponible para un nuevo jugador.')) return;

  try {
    await playersAPI.delete(selectedClubId.value, id);
    currentPage.value = 1;
    pageTokens.value = [null];
    await loadPlayers();
  } catch (error) {
    console.error('Error deleting player:', error);
    alert('Error al eliminar el jugador');
  }
};

const viewPlayer = (player) => {
  router.push({ 
    name: 'PlayerDetail', 
    params: { id: player.id },
    state: { playerStr: JSON.stringify(player) } 
  });
};

const closeModal = () => {
  console.log("Cierra modal")
  showCreateModal.value = false;
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
  form.folio = null;
  form.es_socio = false;
  form.es_jugador = false;
  form.usuario_id = null;
  form.path_foto = '';
  photoFile.value = null;
  photoPreview.value = '';
  uploadProgress.value = 0;

  Object.keys(errors).forEach(key => errors[key] = '');
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

const getCategoryData = (birthDate) => {
  const age = calculateAge(birthDate);
  if (age === '-') return null;

  // Find category matching age
  // categories[0] is 'todos', so skip it or filter
  const cats = categories.value.filter(c => c.id !== 'todos');
  
  return cats.find(c => age >= c.edad_desde && age <= c.edad_hasta);
};

const getCategoryName = (birthDate) => {
  const cat = getCategoryData(birthDate);
  return cat ? cat.nombre : 'SIN CATEGORIA';
};

const getCategoryStyle = (birthDate) => {
  const cat = getCategoryData(birthDate);
  if (!cat) return {};
  
  return {
    color: cat.color,
    border: cat.border,
    background: cat.background
  };
};

/* Removed old getCategory and getCategoryClass */
</script>

<style scoped>
.players-page {
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-top: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.inline {
  display: inline-block;
  margin-right: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.club-select {
  padding: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  min-width: 200px;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--primary-light);
  color: white;
  border-color: var(--primary-light);
}

/* Table */
.table-responsive {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.players-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
}

.players-table th,
.players-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.players-table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.players-table tr:last-child td {
  border-bottom: none;
}

.players-table tr:hover {
  background: var(--bg-hover);
}

.player-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-avatar-small {
  width: 32px;
  height: 32px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
}
.player-avatar-small .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
}

.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Empty State */
.empty-state, .loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 2px dashed var(--border-color);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

/* Modal */
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
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  border: 1px solid var(--border-color);
  animation: fadeIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Search Bar */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
}

.search-icon {
  position: absolute;
  left: 0.875rem;
  font-size: 1rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-light);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem;
  line-height: 1;
}

.search-clear:hover {
  color: var(--text-primary);
}

/* Photo Upload */
.photo-upload-group {
  margin-bottom: 1.25rem;
}

.photo-upload-area {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.photo-upload-area:hover {
  border-color: var(--primary-light);
  background: var(--bg-secondary);
}

.photo-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.photo-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  font-size: 1.75rem;
}

.photo-upload-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.upload-status {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.upload-status.change {
  color: var(--primary-light);
}

.photo-upload-info small {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.hidden-file-input {
  display: none;
}

/* Error Styles */
.input-error {
  border-color: var(--accent-red) !important;
}

.form-error {
  color: var(--accent-red);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

/* Mobile Cards */
.mobile-only { display: none; }
.desktop-only { display: block; }

@media (max-width: 768px) {
  .mobile-only { display: block; }
  .desktop-only { display: none; }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  
  .club-select {
    width: 100%;
  }

  .player-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .player-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .card-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .card-row .label {
    color: var(--text-muted);
  }
  
  .card-row .value {
    color: var(--text-primary);
    font-weight: 500;
  }
}
</style>
