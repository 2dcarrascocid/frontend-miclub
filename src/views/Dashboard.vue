<template>
  <div class="dashboard">
    <div class="container">
      
      <!-- LOADING STATE -->
      <div v-if="loading" class="loading-screen">
        <div class="spinner"></div>
        <p>Cargando tu club...</p>
      </div>

      <!-- SCENARIO 1: NO CLUBS (CREATE FIRST CLUB) -->
      <div v-else-if="clubs.length === 0" class="create-club-screen">
        <div class="welcome-header">
          <h1>¡Bienvenido a Fair Play Chile! 👋</h1>
          <p>Para comenzar, necesitas crear tu primer club deportivo.</p>
        </div>
        
        <div class="create-card">
          <div class="icon-wrapper">🏆</div>
          <h2>Crea tu Club</h2>
          <form @submit.prevent="handleCreateClub">
            <div class="form-group">
              <label>Nombre del Club</label>
              <input 
                type="text" 
                v-model="createForm.nombre" 
                placeholder="Ej: Los Galácticos FC"
                required
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>Dirección</label>
              <input 
                type="text" 
                v-model="createForm.direccion" 
                placeholder="Ej: Av. Siempre Viva 123"
                class="form-input"
              >
            </div>
            <button type="submit" class="btn btn-primary full-width" :disabled="submitting">
              {{ submitting ? 'Creando...' : 'Crear mi Club' }}
            </button>
          </form>
        </div>
      </div>

      <!-- SCENARIO 2: MULTIPLE CLUBS, NONE SELECTED -->
      <div v-else-if="!selectedClub" class="select-club-screen">
        <div class="welcome-header">
          <h2 class="inline">🏆</h2>
          <h1 class="inline">Selecciona tu Club</h1>
          <p>¿Qué club quieres gestionar hoy?</p>
        </div>

        <div class="clubs-grid">
          <div 
            v-for="club in clubs" 
            :key="club.id" 
            class="club-selection-card"
            @click="selectClub(club)"
          >
            <div class="club-avatar">
              {{ club.nombre.charAt(0).toUpperCase() }}
            </div>
            <h3>{{ club.nombre }}</h3>
            <p>{{ club.cantidad_jugadores || 0 }} Jugadores</p>
          </div>
          
          <!-- Option to create another club -->
          <div class="club-selection-card create-new" @click="showCreateModal = true">
            <div class="club-avatar new">+</div>
            <h3>Crear Nuevo Club</h3>
          </div>
        </div>
      </div>

      <!-- SCENARIO 3: CLUB SELECTED (DASHBOARD) -->
      <div v-else class="dashboard-content">
        <div class="dashboard-header">
          <div class="welcome-section">
           <div class="user-avatar">
            {{ userInitials }}
          </div>
            <p class="club-details">
              <strong>{{ selectedClub.nombre.toUpperCase() }}</strong>
              <span class="separator">|</span>
              <span class="user-info">
                {{ userFullName }} 
                <span class="user-role">({{ userRole }})</span>
              </span>
              <button v-if="clubs.length > 1" @click="changeClub" class="btn-link">
                (Cambiar Club)
              </button>
            </p>
            <h1 class="fade-in">Hola, {{ userName }} 👋</h1>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card" v-for="(stat, index) in stats" :key="index" 
               :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="stat-icon" :style="{ background: stat.gradient }">
              {{ stat.icon }}
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ stat.value }}</h3>
              <p class="stat-label">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Quick Actions -->
          <div class="dashboard-section full-width">
            <div class="section-header">
              <h2>🚀 Acciones Rápidas</h2>
            </div>
            <div class="actions-grid">
              <router-link to="/players" class="action-card">
                <span class="action-icon">👥</span>
                <h3>Jugadores</h3>
                <p>Gestiona el plantel</p>
              </router-link>
              
              <router-link to="/finance" class="action-card">
                <span class="action-icon">💰</span>
                <h3>Finanzas</h3>
                <p>Ingresos y gastos</p>
              </router-link>
              
              <router-link to="/clubs" class="action-card">
                <span class="action-icon">⚙️</span>
                <h3>Configuración</h3>
                <p>Editar datos del club</p>
              </router-link>
            </div>
          </div>

          <!-- Actividad Reciente -->
          <div class="dashboard-section full-width">
            <div class="section-header">
              <h2>📊 Resumen Financiero</h2>
            </div>
            <div class="financial-summary">
               <div class="summary-item">
                 <span class="label">Balance del Mes</span>
                 <span class="value" :class="{ positive: balance >= 0, negative: balance < 0 }">
                   {{ formatCurrency(balance) }}
                 </span>
               </div>
               <router-link to="/finance" class="btn btn-outline btn-sm">Ver Detalles</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal (for when already has clubs) -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Nuevo Club</h2>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <form @submit.prevent="handleCreateClub">
          <div class="form-group">
            <label>Nombre del Club</label>
            <input type="text" v-model="createForm.nombre" required class="form-input">
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" v-model="createForm.direccion" class="form-input">
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="showCreateModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">Crear</button>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { clubsAPI, playersAPI, financeAPI, dashboardAPI } from '../api';

const authStore = useAuthStore();
const clubStore = useClubStore();

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

const userFullName = computed(() => {
  const meta = authStore.user.value?.metadata || {};
  if (meta.nombre && meta.apellido) return `${meta.nombre} ${meta.apellido}`;
  return meta.nombre || 'Usuario';
});

const userPhoto = computed(() => {
    return authStore.user.value?.metadata?.path_foto || authStore.user.value?.path_foto || null;
});

const userRole = computed(() => {
  const roles = authStore.state.userRoles || []; // access straight from state or getter if available?
  // Store doesn't expose userRoles in return object yet, checking auth store inspection in step 79
  // Step 79 show: return { state, user, isoAuthenticated... }
  // I need to update auth store return to include userRoles? Or access via state.
  // The state object is returned.
  return authStore.state.userRoles?.[0] || 'Miembro';
});


const userName = computed(() => userFullName.value.split(' ')[0]);
const clubs = computed(() => clubStore.clubs.value);
const selectedClub = computed(() => clubStore.selectedClub.value);
const loading = computed(() => clubStore.loading.value);

const userInitials = computed(() => {
  const name = authStore.user.value?.metadata?.nombre || authStore.user.value?.nombre || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const submitting = ref(false);
const showCreateModal = ref(false);
const balance = ref(0);

const createForm = reactive({
  nombre: '',
  direccion: ''
});

const stats = ref([
  { icon: '⚽', label: 'Jugadores', value: '0', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { icon: '📈', label: 'Ingresos', value: '$0', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { icon: '📉', label: 'Egresos', value: '$0', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
  { icon: '💰', label: 'Balance', value: '$0', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
]);

onMounted(async () => {
  await clubStore.loadClubs();
  
  // Auto-select if only 1 club
  if (clubs.value.length === 1 && !selectedClub.value) {
    clubStore.setSelectedClub(clubs.value[0]);
  }

  if (selectedClub.value) {
    await loadClubStats();
  }
});

// Watch for selection changes to reload stats
watch(selectedClub, async (newClub) => {
  if (newClub) {
    await loadClubStats();
  }
});

const loadClubStats = async () => {
  if (!selectedClub.value) return;
  
  try {
    // Load Dashboard Summary (Players & Partners)
    const summaryRes = await dashboardAPI.getSummary(selectedClub.value.id);
    const { total_jugadores_activos, total_socios_no_jugadores } = summaryRes.data;
    
    stats.value[0].value = (total_jugadores_activos || 0).toString();


    // Load Finance Summary
    const financeRes = await financeAPI.getFinancialSummary(selectedClub.value.id);
    const { ingresos, egresos, balance: balanceTotal } = financeRes.data;
    
    balance.value = balanceTotal;
    stats.value[1].value = formatCurrency(ingresos || 0);
    stats.value[2].value = formatCurrency(egresos || 0);
    stats.value[3].value = formatCurrency(balanceTotal || 0);
    
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

const handleCreateClub = async () => {
  submitting.value = true;
  try {
    const userId = authStore.user.value?.id;
    await clubsAPI.create({ ...createForm, owner_id: userId });
    
    // Reload clubs
    await clubStore.loadClubs();
    
    // If it's the first club, auto-select it
    if (clubs.value.length === 1) {
      clubStore.setSelectedClub(clubs.value[0]);
    }
    
    showCreateModal.value = false;
    createForm.nombre = '';
    createForm.direccion = '';
    showNotification('Club creado correctamente', 'success');
  } catch (error) {
    console.error('Error creating club:', error);
    showNotification('Error al crear el club', 'error');
  } finally {
    submitting.value = false;
  }
};

const selectClub = (club) => {
  clubStore.setSelectedClub(club);
};

const changeClub = () => {
  clubStore.setSelectedClub(null);
};

function getCurrentMonth() {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[new Date().getMonth()];
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: var(--spacing-md);
  color: var(--text-muted);
}

/* Create Club Screen */
.create-club-screen {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  padding-top: var(--spacing-2xl);
}

.welcome-header {
  margin-bottom: var(--spacing-2xl);
}

.welcome-header h1 {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.create-card {
  background: var(--bg-card);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.icon-wrapper {
  font-size: 3rem;
  margin-bottom: var(--spacing-lg);
}

/* Select Club Screen */
.select-club-screen {
  text-align: center;
  padding-top: var(--spacing-xl);
}

.clubs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.club-selection-card {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.club-selection-card:hover {
  transform: translateY(-5px);
  border-color: var(--primary-light);
  box-shadow: var(--shadow-xl);
}
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  box-shadow: var(--shadow-md);
}

.club-avatar {
  width: 80px;
  height: 80px;
  background: var(--primary-gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  font-weight: 700;
}

.club-avatar.new {
  background: transparent;
  border: 2px dashed var(--border-color);
  color: var(--text-muted);
}

.club-selection-card.create-new:hover .club-avatar.new {
  border-color: var(--primary-light);
  color: var(--primary-light);
}

/* Dashboard Content */
.dashboard-header {
  margin-bottom: var(--spacing-2xl);
}

.club-details {
  font-size: 1.1rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.separator {
  color: var(--text-muted);
  font-weight: 300;
}

.user-info {
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.user-role {
  font-size: 0.9em;
  color: var(--text-muted);
  text-transform: capitalize;
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary-light);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
}

.stat-content h3 {
  font-size: 2rem;
  margin: 0;
  color: var(--text-primary);
}

.stat-content p {
  margin: 0;
  color: var(--text-muted);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background: var(--bg-secondary);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-base);
  border: 1px solid var(--border-color);
}

.action-card:hover {
  transform: translateY(-4px);
  background: var(--bg-hover);
  border-color: var(--primary-light);
}

.action-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.financial-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-item .value {
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-item .value.positive { color: #10b981; }
.summary-item .value.negative { color: #ef4444; }

/* Form Styles */
.form-group {
  margin-bottom: var(--spacing-lg);
  text-align: left;
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

.full-width {
  width: 100%;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.inline {
  display: inline-block;
  margin: 0;
}

/* Notification Toast */
.notification-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  color: white;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
}

.notification-toast.success { background: #10b981; }
.notification-toast.error { background: #ef4444; }
.notification-toast.info { background: #3b82f6; }

.notification-message {
  flex: 1;
  font-weight: 500;
}

.notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: 0.8;
  padding: 0;
  line-height: 1;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
