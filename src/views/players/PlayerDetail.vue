<template>
  <div class="player-detail-page">
    <div class="container">
      <!-- Header / Back Button -->
      <div class="header-actions mb-3">
        <button class="btn btn-secondary" @click="goBack">
          ⬅ Regresar a la lista
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando datos del jugador...</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="player" class="player-card fade-in">
        <!-- Header: Avatar & Basic Info -->
        <div class="player-header">
          <div class="avatar-section">
            <div class="avatar-container">
              <img v-if="player.path_foto" :src="player.path_foto" alt="Foto jugador" class="player-photo" />
              <div v-else class="avatar-placeholder">
                {{ getInitials(player.nombre_completo) }}
              </div>
              
              <!-- Photo Actions -->
              <div class="photo-actions" v-if="isEditing">
                 <button class="btn-icon-small add" @click="handleAddPhoto" title="Agregar Foto">📷</button>
                 <button v-if="player.path_foto" class="btn-icon-small delete" @click="handleDeletePhoto" title="Eliminar Foto">❌</button>
              </div>
            </div>
          </div>

          <div class="info-section">
             <div class="name-header">
               <h1 v-if="!isEditing">{{ player.nombre_completo }}</h1>
               <div v-else class="form-group mb-0">
                 <label>Nombre Completo</label>
                 <input type="text" v-model="form.nombre_completo" class="form-input" />
               </div>
               
               <div class="badges mt-1">
                 <span class="badge badge-primary">Folio: {{ player.folio || 'N/A' }}</span>
                 <span :class="['badge', getCategoryClass(player.fecha_nacimiento)]">
                    {{ getCategory(player.fecha_nacimiento) }}
                 </span>
                 <span v-if="!player.activo" class="badge badge-danger">Inactivo</span>
                 <span v-else class="badge badge-success">Activo</span>
               </div>
             </div>
          </div>
          
          <div class="actions-section">
             <button v-if="!isEditing" class="btn btn-primary" @click="toggleEdit">
               ✏️ Editar
             </button>
             <div v-else class="edit-actions">
               <button class="btn btn-success" @click="saveChanges" :disabled="saving">
                 {{ saving ? 'Guardando...' : '💾 Guardar' }}
               </button>
               <button class="btn btn-secondary" @click="cancelEdit" :disabled="saving">
                 ❌ Cancelar
               </button>
             </div>
             
             <button v-if="!isEditing" class="btn btn-danger mt-2" @click="confirmDelete">
               🗑️ Eliminar Jugador
             </button>
          </div>
        </div>

        <hr class="divider" />

        <!-- Details Grid -->
        <div class="details-grid">
          <!-- Personal Info -->
           <div class="detail-group card">
             <h3>Información Personal</h3>
             
             <div class="form-group">
               <label>RUT</label>
               <div v-if="!isEditing" class="detail-value">{{ player.rut }}</div>
               <input v-else type="text" v-model="form.rut" class="form-input" />
             </div>

             <div class="form-group">
               <label>Fecha de Nacimiento</label>
               <div v-if="!isEditing" class="detail-value">{{ formatDate(player.fecha_nacimiento) }} ({{ calculateAge(player.fecha_nacimiento) }} años)</div>
               <input v-else type="date" v-model="form.fecha_nacimiento" class="form-input" />
             </div>
           </div>

           <!-- Contact Info -->
           <div class="detail-group card">
             <h3>Datos de Contacto</h3>
             
             <div class="form-group">
               <label>Email</label>
               <div v-if="!isEditing" class="detail-value">{{ player.email }}</div>
               <input v-else type="email" v-model="form.email" class="form-input" />
             </div>

             <div class="form-group">
               <label>Teléfono</label>
               <div v-if="!isEditing" class="detail-value">{{ player.telefono }}</div>
               <input v-else type="tel" v-model="form.telefono" class="form-input" />
             </div>
           </div>

           <!-- Memberships -->
           <div class="detail-group card">
             <h3>Membresía</h3>
             
             <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" v-model="form.es_socio" :disabled="!isEditing" />
                  <span>⭐ Es Socio</span>
                </label>
             </div>
             
             <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" v-model="form.es_jugador" :disabled="!isEditing" />
                  <span>⚽ Es Jugador</span>
                </label>
             </div>

             <div class="form-group">
                <label>Club ID</label>
                <div class="detail-value sm">{{ player.club_id }}</div>
             </div>
           </div>
        </div>

      </div>

      <!-- Not Found / Error -->
      <div v-else class="empty-state">
        <span class="empty-icon">❌</span>
        <h3>Jugador no encontrado</h3>
        <button class="btn btn-primary" @click="goBack">Volver</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { playersAPI } from '../../api';

const route = useRoute();
const router = useRouter();
const playerId = route.params.id;

const player = ref(null);
const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);

// Form state
const form = reactive({
  nombre_completo: '',
  rut: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  es_socio: false,
  es_jugador: false,
  activo: true,
  path_foto: ''
});

onMounted(async () => {
  await loadPlayer();
});

const loadPlayer = async () => {
  loading.value = true;
  try {
    let data = null;

    // Check if player data was passed via router state
    if (history.state && history.state.playerStr) {
       try {
         data = JSON.parse(history.state.playerStr);
         console.log('Loaded player from state:', data);
       } catch (e) {
         console.error('Error parsing player state', e);
       }
    }

    // Fallback to API if no state or parse error
    if (!data) {
        console.log('Fetching player from API...');
        const response = await playersAPI.getById(playerId);
        data = response.data || response; 
    }

    player.value = data;
    
    // Init form
    Object.assign(form, {
        nombre_completo: data.nombre_completo,
        rut: data.rut,
        email: data.email,
        telefono: data.telefono,
        fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.split('T')[0] : '', // Format for date input
        es_socio: data.es_socio,
        es_jugador: data.es_jugador,
        activo: data.activo,
        path_foto: data.path_foto
    });

  } catch (error) {
    console.error('Error loading player:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/players');
};

const toggleEdit = () => {
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
  // Reset form to current player values
  if (player.value) {
      Object.assign(form, {
        nombre_completo: player.value.nombre_completo,
        rut: player.value.rut,
        email: player.value.email,
        telefono: player.value.telefono,
        fecha_nacimiento: player.value.fecha_nacimiento ? player.value.fecha_nacimiento.split('T')[0] : '',
        es_socio: player.value.es_socio,
        es_jugador: player.value.es_jugador,
        activo: player.value.activo
      });
  }
};

const saveChanges = async () => {
  if (!confirm('¿Guardar cambios?')) return;
  
  saving.value = true;
  try {
    const updateData = {
        id: playerId,
        ...form
    };
    
    await playersAPI.update(updateData);
    
    // Refresh data
    await loadPlayer();
    isEditing.value = false;
  } catch (error) {
    console.error('Error updating player:', error);
    alert('Error al actualizar el jugador. Verifica que el backend soporte esta operación.');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
    if (!confirm('¿Estás seguro de ELIMINAR logicamente a este jugador? Se marcará como inactivo.')) return;
    
    try {
        // Logical delete: update activo = false
        // Or if API supports delete -> playersAPI.delete(playerId)
        // User requested: "eliminacion logica osea estado activo = false"
        // If the backend `delete` endpoint does logical delete, great. 
        // If not, we might need to use `update` with `activo: false`.
        // Let's try update first as it's safer for "logical" delete if delete is destructive.
        
        await playersAPI.update({
            id: playerId,
            activo: false
        });
        
        alert('Jugador eliminado correctamente.');
        router.push('/players');
        
    } catch (error) {
        console.error('Error deleting player:', error);
         alert('Error al desactivar el jugador.');
    }
};


// Photo Handlers (Mock logic mostly, as no endpoint specified)
const handleAddPhoto = () => {
    const url = prompt('Ingrese URL de la foto (o implemente subida de archivos real):', 'https://via.placeholder.com/150');
    if (url) {
        form.path_foto = url;
        player.value.path_foto = url; // optimistic update
    }
};

const handleDeletePhoto = () => {
    if(confirm('¿Eliminar foto?')) {
        form.path_foto = null;
        player.value.path_foto = null; // optimistic update
    }
};

// Utilities
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

const formatDate = (dateStr) => {
    if(!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
}

const getCategory = (birthDate) => {
  const age = calculateAge(birthDate);
  if (age === '-' || isNaN(age)) return '';
  if (age >= 55) return 'Dorado';
  if (age > 45) return 'Super Senior';
  if (age >= 35) return 'Senior';
  return 'General';
};

const getCategoryClass = (birthDate) => {
  const category = getCategory(birthDate);
  if (category === 'Senior') return 'badge-senior';
  if (category === 'Super Senior') return 'badge-super';
  if (category === 'Dorado') return 'badge-dorado';
  return 'badge-primary';
};

</script>

<style scoped>
.player-detail-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.player-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-xl);
}

/* Header Section */
.player-header {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
  flex-wrap: wrap;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
}

.player-photo, .avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--bg-tertiary);
  box-shadow: var(--shadow-lg);
}

.avatar-placeholder {
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

.photo-actions {
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  gap: 5px;
}

.btn-icon-small {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}
.btn-icon-small:hover { transform: scale(1.1); }
.btn-icon-small.add { color: var(--accent-green); }
.btn-icon-small.delete { color: var(--accent-red); }

.info-section {
  flex: 1;
  min-width: 250px;
}

.name-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.actions-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    min-width: 150px;
}

.divider {
    border: 0;
    border-top: 1px solid var(--border-color);
    margin: var(--spacing-xl) 0;
}

/* Grid Details */
.details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-lg);
}

.detail-group {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    background: rgba(255,255,255,0.02);
}

.detail-group h3 {
    font-size: 1.1rem;
    margin-bottom: var(--spacing-lg);
    color: var(--primary-light);
    border-bottom: 2px solid rgba(255,255,255,0.05);
    padding-bottom: 0.5rem;
}

.detail-value {
    font-size: 1.1rem;
    font-weight: 500;
}
.detail-value.sm { font-size: 0.9rem; color: var(--text-muted); }

.checkbox-group {
    margin-bottom: var(--spacing-md);
}
.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 1.1rem;
}
.checkbox-group input[type="checkbox"] {
    width: 20px; 
    height: 20px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--text-muted);
}
.empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }

@media (max-width: 768px) {
    .player-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .badges {
        justify-content: center;
    }
    .actions-section {
        width: 100%;
        flex-direction: row;
        justify-content: center;
    }
}
</style>
