<template>
  <div class="player-detail-page">
    <div class="container">
      <!-- Header / Back Button -->
      <div class="header-actions mb-3">
        <button class="btn btn-secondary" @click="goBack">
          ⬅ Regresar a la lista
        </button>
      </div>

      <!-- Feedback Message -->
      <div v-if="feedbackMessage" :class="['feedback-message', feedbackType]">
        {{ feedbackMessage }}
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
              <img v-if="player.path_foto" :src="getDetailUrl(player.path_foto)" alt="Foto jugador" class="player-photo" />
              <div v-else class="avatar-placeholder">
                {{ getInitials(player.nombre_completo) }}
              </div>

              <!-- Upload Progress -->
              <div v-if="uploadingPhoto" class="upload-overlay">
                <div class="upload-progress-ring">{{ uploadProgress }}%</div>
              </div>

              <!-- Photo Actions -->
              <div class="photo-actions" v-if="isEditing">
                 <button class="btn-icon-small add" @click="handleAddPhoto" title="Agregar Foto" :disabled="uploadingPhoto">📷</button>
                 <button v-if="player.path_foto" class="btn-icon-small delete" @click="handleDeletePhoto" title="Eliminar Foto">❌</button>
              </div>

              <!-- Hidden file input -->
              <input
                type="file"
                ref="photoInput"
                accept="image/*"
                style="display:none"
                @change="onPhotoSelected"
              />
            </div>
          </div>

          <div class="info-section">
             <div class="name-header">
               <h1 v-if="!isEditing">{{ player.nombre_completo }}</h1>
               <div v-else class="form-group mb-0">
                 <label>Nombre Completo</label>
                 <input type="text" v-model="form.nombre_completo" class="form-input" :class="{ 'error-border': errors.nombre_completo }" />
                 <span v-if="errors.nombre_completo" class="form-error">{{ errors.nombre_completo }}</span>
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
               <label>Folio</label>
               <div v-if="!isEditing" class="detail-value">{{ player.folio || 'N/A' }}</div>
               <div v-else>
                 <input type="number" v-model.number="form.folio" class="form-input" :class="{ 'error-border': errors.folio }" placeholder="Folio" />
                 <span v-if="errors.folio" class="form-error">{{ errors.folio }}</span>
               </div>
             </div>

             <div class="form-group">
               <label>RUT</label>
               <div v-if="!isEditing" class="detail-value">{{ player.rut }}</div>
               <div v-else>
                 <input type="text" v-model="form.rut" class="form-input" :class="{ 'error-border': errors.rut }" />
                 <span v-if="errors.rut" class="form-error">{{ errors.rut }}</span>
               </div>
             </div>

             <div class="form-group">
               <label>Fecha de Nacimiento</label>
               <div v-if="!isEditing" class="detail-value">{{ formatDate(player.fecha_nacimiento) }} ({{ calculateAge(player.fecha_nacimiento) }} años)</div>
               <div v-else>
                 <input type="date" v-model="form.fecha_nacimiento" class="form-input" :class="{ 'error-border': errors.fecha_nacimiento }" />
                 <span v-if="errors.fecha_nacimiento" class="form-error">{{ errors.fecha_nacimiento }}</span>
               </div>
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
               <div v-else>
                 <input type="tel" v-model="form.telefono" class="form-input" :class="{ 'error-border': errors.telefono }" />
                 <span v-if="errors.telefono" class="form-error">{{ errors.telefono }}</span>
               </div>
             </div>
           </div>

           <!-- Memberships -->
           <div class="detail-group card">
             <h3>Membresía</h3>
             
             <div class="form-group">
                <label>Club</label>
                <div class="detail-value sm">{{ player.nombre_club.toUpperCase() }}</div>
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
    <!-- Confirmation Modal -->
    <ConfirmationModal 
      :isOpen="modalState.isOpen"
      :title="modalState.title"
      :message="modalState.message"
      :type="modalState.type"
      @close="closeConfirmModal"
      @confirm="handleModalConfirm"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ConfirmationModal from '../../components/ConfirmationModal.vue';
import { useAuthStore } from '../../stores/auth';
import { useClubStore } from '../../stores/club';
import { playersAPI } from '../../api';
import { useCloudinary } from '../../composables/useCloudinary.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const clubStore = useClubStore();

const playerId = route.params.id;
const player = ref(null);
const loading = ref(true);
const saving = ref(false);
const feedbackMessage = ref(null);
const feedbackType = ref('');

const form = reactive({
    nombre_completo: '',
    rut: '',
    fecha_nacimiento: '',
    email: '',
    telefono: '',
    es_socio: false,
    es_jugador: false,
    path_foto: '',
    folio: ''
});

const errors = reactive({
    nombre_completo: '',
    rut: '',
    fecha_nacimiento: '',
    telefono: '',
    folio: ''
});

const isEditing = ref(false);
const uploadingPhoto = ref(false);
const uploadProgress = ref(0);

const { uploadImage, getDetailUrl } = useCloudinary();

// Validation Helpers
const validateRutChileno = (rut) => {
    if (!rut) return false;
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    if (cleanRut.length < 2) return false;
    
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    if (!/^\d+$/.test(body)) return false;
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const mod = 11 - (sum % 11);
    const calculatedDv = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
    
    return dv === calculatedDv;
};

const validateForm = () => {
    let isValid = true;
    // Reset errors
    Object.keys(errors).forEach(key => errors[key] = '');

    // Nombre Completo: no vacio, solo letras y espacios
    if (!form.nombre_completo || !form.nombre_completo.trim()) {
        errors.nombre_completo = 'El nombre es obligatorio';
        isValid = false;
    } else if (!/^[a-zA-Z\s\u00C0-\u00FF]+$/.test(form.nombre_completo)) {
        errors.nombre_completo = 'Solo se permiten letras y espacios';
        isValid = false;
    }

    // RUT: no vacio, validacion chileno
    if (!form.rut || !form.rut.trim()) {
        errors.rut = 'El RUT es obligatorio';
        isValid = false;
    } else if (!validateRutChileno(form.rut)) {
        errors.rut = 'RUT inválido (Ej: 12345678-9)';
        isValid = false;
    }

    // Telefono: no vacio, solo numeros y guion
    if (!form.telefono || !form.telefono.trim()) {
        errors.telefono = 'El teléfono es obligatorio';
        isValid = false;
    } else if (!/^[0-9-]+$/.test(form.telefono)) {
        errors.telefono = 'Solo se permiten números y guiones';
        isValid = false;
    }

    // Fecha Nacimiento: no vacio, fecha valida
    if (!form.fecha_nacimiento) {
        errors.fecha_nacimiento = 'La fecha es obligatoria';
        isValid = false;
    } else {
        const date = new Date(form.fecha_nacimiento);
        if (isNaN(date.getTime())) {
            errors.fecha_nacimiento = 'Fecha inválida';
            isValid = false;
        }
    }

    // Folio: entero mayor que cero
    if (form.folio === null || form.folio === '') {
        errors.folio = 'El folio es obligatorio';
        isValid = false;
    } else if (!Number.isInteger(Number(form.folio)) || Number(form.folio) <= 0) {
        errors.folio = 'Debe ser un número entero mayor que cero';
        isValid = false;
    }

    return isValid;
};

// Modal State
const modalState = reactive({
  isOpen: false,
  title: '',
  message: '',
  type: 'primary',
  confirmAction: null
});

// Helper to open modal
const confirmAction = (title, message, type, action) => {
  modalState.title = title;
  modalState.message = message;
  modalState.type = type;
  modalState.confirmAction = action;
  modalState.isOpen = true;
};

const handleModalConfirm = async () => {
  if (modalState.confirmAction) {
    await modalState.confirmAction();
  }
  closeConfirmModal();
};

const closeConfirmModal = () => {
    modalState.isOpen = false;
    modalState.confirmAction = null;
};

const showFeedback = (message, type = 'success') => {
    feedbackMessage.value = message;
    feedbackType.value = type;
    setTimeout(() => {
        feedbackMessage.value = null;
    }, 3000);
};

const populateForm = () => {
    if (!player.value) return;
    Object.assign(form, {
      nombre_completo: player.value.nombre_completo,
      rut: player.value.rut,
      fecha_nacimiento: player.value.fecha_nacimiento ? player.value.fecha_nacimiento.split('T')[0] : '',
      email: player.value.email,
      telefono: player.value.telefono,
      es_socio: player.value.es_socio,
      es_jugador: player.value.es_jugador,
      path_foto: player.value.path_foto,
      folio: player.value.folio
    });
};

const loadPlayer = async () => {
  loading.value = true;
  feedbackMessage.value = null; // Limpiar mensajes previos

  try {
    // 1. Intentar cargar desde el estado de navegación
    if (history.state?.playerStr) {
        try {
            const playerFromState = JSON.parse(history.state.playerStr);
            // Verificar si el ID coincide
            if (String(playerFromState.id) === String(playerId)) {
                console.log("Cargando jugador desde estado local");
                player.value = playerFromState;
                populateForm();
                loading.value = false;
                return; // Éxito, salir
            }
        } catch (e) {
            console.warn("Error parseando playerStr del estado", e);
            // No lanzar error aquí, intentar cargar desde API
        }
    }

    // 2. Si no hay estado o falló, cargar desde API
    console.log("Cargando jugador desde API...");
    // Necesitamos el clubId, si no está en params, lo intentamos sacar del store o query
    const clubId = route.query.club || clubStore.selectedClub.value?.id;
    
    if (!clubId) {
        throw new Error("No se ha especificado el club");
    }

    const response = await playersAPI.getById(clubId, playerId);
    
    if (response.data) {
        player.value = response.data;
        populateForm();
    } else {
        throw new Error("No se encontraron datos del jugador");
    }

  } catch (error) {
    console.error('Error loading player:', error);
    // Solo mostrar error si realmente falló todo y no tenemos datos
    if (!player.value) {
        showFeedback('Error al cargar datos del jugador: ' + (error.message || 'Error desconocido'), 'error');
    }
  } finally {
    loading.value = false;
  }
};


const toggleEdit = () => {
    populateForm(); // Asegurar que el form tenga los datos actuales antes de editar
    Object.keys(errors).forEach(key => errors[key] = ''); // Limpiar errores
    isEditing.value = true;
};

const cancelEdit = () => {
    isEditing.value = false;
    Object.keys(errors).forEach(key => errors[key] = ''); // Limpiar errores
    // Reset form
    populateForm();
};

const goBack = () => {
    router.back();
};

onMounted(() => {
    loadPlayer();
});

const saveChanges = async () => {
  if (!validateForm()) {
      showFeedback('Por favor corrija los errores en el formulario', 'error');
      return;
  }

  confirmAction(
    'Confirmar Cambios',
    '¿Estás seguro de que deseas guardar los cambios realizados?',
    'primary',
    async () => {
        saving.value = true;
        feedbackMessage.value = null;

        try {
            const updateData = {
                ...form,
                usuario_id: authStore.user.value?.id
            };
            
            // Usar el endpoint actualizado con clubId
            await playersAPI.update(player.value.club_id, playerId, updateData);
            
            showFeedback('Jugador actualizado correctamente', 'success');
            
            // Actualizar datos locales sin recargar API si es posible
            Object.assign(player.value, updateData);
            
            // Opcional: Recargar desde API para asegurar consistencia
            // await loadPlayer(); 
            
            isEditing.value = false;

        } catch (error) {
            console.error('Error updating player:', error);
            showFeedback('Error al actualizar: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
            saving.value = false;
        }
    }
  );
};

const confirmDelete = async () => {
    confirmAction(
        'Eliminar Jugador',
        '¿Estás seguro de ELIMINAR logicamente a este jugador? Se marcará como inactivo.',
        'danger',
        async () => {
            saving.value = true;
            try {
                const updateData = {
                    activo: false,
                    usuario_id: authStore.user.value?.id
                };

                await playersAPI.update(player.value.club_id, playerId, updateData);
                
                showFeedback('Jugador eliminado (lógico) correctamente', 'success');
                
                setTimeout(() => {
                    router.push('/players');
                }, 1500);
                
            } catch (error) {
                console.error('Error deleting player:', error);
                showFeedback('Error al eliminar jugador', 'error');
                saving.value = false;
            }
        }
    );
};

// Photo Handlers
const photoInput = ref(null);

const handleAddPhoto = () => {
    photoInput.value?.click();
};

const onPhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showFeedback('Solo se permiten imágenes (JPG, PNG, WEBP)', 'error');
        return;
    }

    uploadingPhoto.value = true;
    uploadProgress.value = 0;

    try {
        const url = await uploadImage(file, (pct) => { uploadProgress.value = pct; });

        // Guardar URL en DB
        await playersAPI.update(player.value.club_id, playerId, { path_foto: url });

        form.path_foto = url;
        player.value.path_foto = url;
        showFeedback('Foto actualizada correctamente', 'success');
    } catch (err) {
        showFeedback(err.message || 'Error al subir la foto', 'error');
    } finally {
        uploadingPhoto.value = false;
        uploadProgress.value = 0;
        event.target.value = '';
    }
};

const handleDeletePhoto = () => {
    confirmAction(
        'Eliminar Foto',
        '¿Estás seguro de eliminar la foto del jugador?',
        'danger',
        async () => {
            await playersAPI.update(player.value.club_id, playerId, { path_foto: null });
            form.path_foto = null;
            player.value.path_foto = null;
            showFeedback('Foto eliminada', 'success');
        }
    );
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
.btn-icon-small:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.upload-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.upload-progress-ring {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
}

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


.feedback-message {
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.3s ease;
}
.feedback-message.success {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.feedback-message.error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-border {
    border-color: var(--accent-red) !important;
    box-shadow: 0 0 0 1px var(--accent-red) !important;
}
</style>
