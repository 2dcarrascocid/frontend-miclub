<template>
  <div class="club-detail-page">
    <div class="container">
      <!-- Header / Info Club -->
      <div class="page-header" v-if="club">
        <div>
          <button class="btn-back" @click="$router.back()">← Volver</button>
          <div class="header-content">
            <h1 class="club-title">{{ club.nombre }}</h1>
            <span class="club-badge">{{ club.cantidad_jugadores }} Jugadores</span>
          </div>
          <p class="club-description">{{ club.descripcion }}</p>
        </div>
        <div class="header-actions">
           <router-link to="/membership" class="btn btn-outline" v-if="isFreePlan">
               ⭐ Mejorar Plan
           </router-link>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando detalles del club...</p>
      </div>

      <div v-else-if="!club" class="empty-state">
        <h3>No se encontró el club</h3>
        <button class="btn btn-primary" @click="$router.push('/clubes')">Volver a Clubes</button>
      </div>

      <div v-else>
        <!-- Categories Section -->
        <div class="section-header">
          <h2>Categorías</h2>
          <button class="btn btn-primary" @click="openModal()">
            ➕ Nueva Categoría
          </button>
        </div>

        <div class="cards-list">
          <div v-if="categories.length === 0" class="empty-state">No hay categorías registradas</div>
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="category-card"
            :style="{ border: cat.border, background: cat.background }"
          >
            <div class="card-header">
              <div class="chip" :style="{ color: cat.color }">
                <span class="color-dot" :style="{ background: cat.color }"></span>
                {{ cat.nombre }}
              </div>
              <span class="age-range">{{ cat.edad_desde }} - {{ cat.edad_hasta }} años</span>
            </div>
            <p class="card-description">{{ cat.descripcion || '-' }}</p>
            <div class="card-footer action-buttons">
              <button class="btn-icon" @click="openModal(cat)" title="Editar">✏️</button>
              <button class="btn-icon delete" @click="deleteCategory(cat.id)" title="Eliminar">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" v-model="form.nombre" required class="form-input" placeholder="Ej: Senior">
          </div>
          
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="form.descripcion" class="form-input" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Edad Desde *</label>
              <input type="number" v-model.number="form.edad_desde" required class="form-input" min="0">
            </div>
            
            <div class="form-group">
              <label>Edad Hasta *</label>
              <input type="number" v-model.number="form.edad_hasta" required class="form-input" min="0">
            </div>
          </div>

          <div class="form-group">
            <label>Color Distintivo</label>
            <div class="color-picker-container">
              <input type="color" v-model="form.color" class="color-input">
              <span class="color-preview" :style="{ background: form.background, border: form.border }">
                Vista Previa
              </span>
            </div>
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { clubsAPI, categoriesAPI } from '../api';
import { useClubStore } from '../stores/club';

const route = useRoute();
const router = useRouter();
const clubStore = useClubStore();
const clubId = route.params.id;

const isFreePlan = computed(() => {
    return !clubStore.subscription?.plan || clubStore.subscription?.plan?.tier === 'free';
});

const club = ref(null);
const categories = ref([]);
const loading = ref(true);
const submitting = ref(false);

// Modal state
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const form = reactive({
  nombre: '',
  descripcion: '',
  edad_desde: null,
  edad_hasta: null,
  color: '#22c55e',
  border: '',
  background: ''
});

// Watch color to update derived styles
watch(() => form.color, (newColor) => {
  if (newColor) {
    // Convert hex to rgb for opacity
    const r = parseInt(newColor.slice(1, 3), 16);
    const g = parseInt(newColor.slice(3, 5), 16);
    const b = parseInt(newColor.slice(5, 7), 16);
    
    form.background = `rgba(${r}, ${g}, ${b}, 0.2)`;
    form.border = `1px solid rgba(${r}, ${g}, ${b}, 0.4)`;
  }
}, { immediate: true });

onMounted(async () => {
  await loadClubData();
});

const loadClubData = async () => {
  loading.value = true;
  try {
    // Cargar datos del club (puedes ajustar esto si ya tienes el club en store o params)
    // Asumiendo que existe un endpoint getById o usamos getAll y filtramos
    // Si no existe getById público, quizás debamos pasarlo por state o usar getAll
    // Para asegurar, intentaremos getById si existe, sino getAll
    try {
        const clubRes = await clubsAPI.getById(clubId);
        club.value = clubRes.data;
    } catch (e) {
        // Fallback si no existe getById o falla
        console.warn("Fallo carga directa, intentando lista", e);
        // Esto es un parche si getById no está implementado
    }

    // Si no se cargó arriba (ej. endpoint no existe), intentamos cargar de categoriesAPI
    // Pero categoriesAPI solo trae categorias.
    // El usuario mencionó que quiere ver detalles del club.
    // Si la API de clubes no tiene getById, quizás debamos confiar en que se pasó por history.state
    if (!club.value && history.state?.clubStr) {
        club.value = JSON.parse(history.state.clubStr);
    }
    
    if (club.value) {
        // Aseguramos que el store tenga este club seleccionado
        clubStore.setSelectedClub(club.value);
    } else {
        // Intentar cargar suscripción de todos modos si tenemos ID
        await clubStore.loadSubscription(clubId);
    }

    await loadCategories();

  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await categoriesAPI.getAll(clubId);
    categories.value = res.data || [];
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

const openModal = (category = null) => {
  if (category) {
    isEditing.value = true;
    editingId.value = category.id;
    form.nombre = category.nombre;
    form.descripcion = category.descripcion;
    form.edad_desde = category.edad_desde;
    form.edad_hasta = category.edad_hasta;
    form.color = category.color || '#22c55e';
    // border/background will be auto-set by watcher, 
    // but if we want to preserve exact values from DB if they differ from formula:
    // form.border = category.border;
    // form.background = category.background;
  } else {
    isEditing.value = false;
    editingId.value = null;
    form.nombre = '';
    form.descripcion = '';
    form.edad_desde = null;
    form.edad_hasta = null;
    form.color = '#22c55e';
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    const data = {
      ...form,
      id_club: clubId
    };

    if (isEditing.value) {
      await categoriesAPI.update(clubId, editingId.value, data);
    } else {
      await categoriesAPI.create(clubId, data);
    }

    await loadCategories();
    closeModal();
  } catch (error) {
    console.error('Error saving category:', error);
    alert('Error al guardar la categoría');
  } finally {
    submitting.value = false;
  }
};

const deleteCategory = async (id) => {
  if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
  try {
    await categoriesAPI.delete(clubId, id);
    await loadCategories();
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Error al eliminar la categoría');
  }
};
</script>

<style scoped>
.club-detail-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.btn-back {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  margin-bottom: var(--spacing-md);
  padding: 0;
  font-size: 0.9rem;
}

.btn-back:hover {
  color: var(--primary-color);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.club-title {
  font-size: 2.5rem;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.club-badge {
  background: var(--bg-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.club-description {
  color: var(--text-muted);
  font-size: 1.1rem;
  max-width: 600px;
}

/* Invitaciones */
.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.invite-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  gap: 1rem;
}

.invite-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.invite-email {
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
  gap: 0.5rem;
  flex-shrink: 0;
}

.invite-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
}

.invite-badge.pendiente  { background: rgba(234,179,8,0.15);  color: #ca8a04; }
.invite-badge.aceptada   { background: rgba(34,197,94,0.15);  color: #16a34a; }
.invite-badge.revocada,
.invite-badge.vencida    { background: rgba(239,68,68,0.1);   color: #dc2626; }

.empty-state.small {
  padding: 1.5rem;
  font-size: 0.9rem;
}

.copy-msg {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  word-break: break-all;
}

.error-msg {
  color: var(--accent-red);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: var(--bg-secondary);
  font-weight: 600;
}

.age-range {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.card-description {
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.color-dot {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
}

/* Table Styles */
.table-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 0.85rem;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.text-center {
  text-align: center;
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
  font-size: 1.1rem;
}

.btn-icon:hover {
  opacity: 1;
}

.btn-icon.delete:hover {
  filter: hue-rotate(320deg); /* reddish */
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  font-size: 1.5rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 50px;
  height: 40px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.color-preview {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}
</style>
