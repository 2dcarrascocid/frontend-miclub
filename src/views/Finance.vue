<template>
  <div class="finance-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h2 class="inline">💰</h2>
          <h1 class="inline">Finanzas</h1>
          <p>Controla los ingresos y gastos de tu club</p>
        </div>
        <div class="header-actions">
          <select v-model="selectedClubId" class="club-select" @change="loadTransactions">
            <option value="" disabled>Selecciona un club</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.nombre }}
            </option>
          </select>
          <div class="action-buttons">
            <!-- <button class="btn btn-outline" @click="showCloseMonthModal = true" :disabled="!selectedClubId">
              📅 Cerrar Mes
            </button> -->
            <button 
              class="btn btn-secondary" 
              @click="showBatchUpload = !showBatchUpload" 
              :disabled="!selectedClubId"
              :class="{ active: showBatchUpload }"
            >
              📊 {{ showBatchUpload ? 'Ver Lista' : 'Crear Planilla' }}
            </button>
            <button v-if="!showBatchUpload" class="btn btn-primary" @click="showCreateModal = true" :disabled="!selectedClubId">
              ➕ Nuevo Movimiento
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando finanzas...</p>
      </div>

      <!-- No Club Selected -->
      <div v-else-if="!selectedClubId" class="empty-state">
        <span class="empty-icon">👆</span>
        <h3>Selecciona un club</h3>
        <p>Elige un club para ver sus movimientos financieros</p>
      </div>

      <div v-else>
        
        <BatchFinanceUpload 
          v-if="showBatchUpload"
          :club-id="selectedClubId"
          @completed="handleBatchComplete"
          @notify="handleBatchNotify"
        />

        <div v-else>
          <!-- Summary Cards -->
          <div class="summary-grid">
            <div class="summary-card income">
              <span class="summary-icon">📈</span>
              <div class="summary-info">
                <span class="label">Ingresos</span>
                <span class="value">{{ formatCurrency(totalIncome) }}</span>
              </div>
            </div>
            <div class="summary-card expense">
              <span class="summary-icon">📉</span>
              <div class="summary-info">
                <span class="label">Gastos</span>
                <span class="value">{{ formatCurrency(totalExpense) }}</span>
              </div>
            </div>
            <div class="summary-card balance">
              <span class="summary-icon">💰</span>
              <div class="summary-info">
                <span class="label">Balance</span>
                <span class="value" :class="{ negative: balance < 0 }">
                  {{ formatCurrency(balance) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Transactions List -->
          <div class="transactions-section">
            <div class="section-header">
              <div class="header-left">
                <h2>Movimientos Recientes</h2>
                <span class="total-badge" v-if="totalRegistros">{{ totalRegistros }} registros</span>
              </div>
              <div class="filter-controls">
                <button 
                  class="filter-btn" 
                  :class="{ active: filterType === 'todos' }" 
                  @click="setFilter('todos')"
                >
                  Todos
                </button>
                <button 
                  class="filter-btn" 
                  :class="{ active: filterType === 'ingreso' }" 
                  @click="setFilter('ingreso')"
                >
                  Ingresos
                </button>
                <button 
                  class="filter-btn" 
                  :class="{ active: filterType === 'egreso' }" 
                  @click="setFilter('egreso')"
                >
                  Egresos
                </button>
              </div>
            </div>
            
            <div v-if="transactions.length === 0" class="empty-list">
              <p>No hay movimientos registrados en este periodo</p>
            </div>

            <div v-else class="transactions-container">
              <!-- Mobile Cards View -->
              <div class="mobile-cards-view">
                <div v-for="t in transactions" :key="t.id" class="transaction-card" :class="t.tipo.toLowerCase()">
                  <div class="card-header">
                    <div class="card-type">
                      <span class="type-icon">{{ t.tipo === 'ingreso' ? '↑' : '↓' }}</span>
                      <span class="type-text">{{ t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto' }}</span>
                    </div>
                    <span class="card-amount" :class="t.tipo">{{ t.tipo === 'ingreso' ? '+' : '-' }} {{ formatCurrency(t.monto) }}</span>
                  </div>
                  
                  <div class="card-body">
                    <div class="card-row">
                      <span class="card-label">Descripción:</span>
                      <span class="card-value">{{ t.descripcion }}</span>
                    </div>
                    <div class="card-row" v-if="t.categoria">
                      <span class="card-label">Categoría:</span>
                      <span class="card-value">{{ t.categoria }}</span>
                    </div>
                    <div class="card-row">
                      <span class="card-label">Fecha:</span>
                      <span class="card-value">{{ formatDate(t.fecha_movimiento || t.created_at) }}</span>
                    </div>
                    <div class="card-row" v-if="t.jugador">
                      <span class="card-label">Jugador:</span>
                      <span class="card-value">{{ t.jugador.nombre_completo }}</span>
                    </div>
                  </div>
                  
                  <div class="card-footer">
                    <span class="registrado-por">Por: {{ t.registrado_por_nombre || 'Admin' }}</span>
                  </div>
                </div>
              </div>

              <!-- Desktop Table View -->
              <div class="table-responsive desktop-table-view">
                <table class="finance-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    <th>Jugador</th>
                    <th>Registrado Por</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in transactions" :key="t.id">
                    <td>
                      <span class="badge" :class="t.tipo.toLowerCase()">
                        {{ t.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Gasto' }}
                      </span>
                    </td>
                    <td>{{ t.categoria || '-' }}</td>
                    <td class="cell-desc" :title="t.descripcion">{{ t.descripcion }}</td>
                    <td>{{ formatDate(t.fecha_movimiento || t.created_at) }}</td>
                    <td>
                      <span v-if="t.jugador && t.jugador.nombre_completo">
                        👤 {{ t.jugador.nombre_completo }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>
                      <span class="text-sm">
                        {{ t.registrado_por_nombre || 'Admin' }}
                      </span>
                    </td>
                    <td class="text-right font-bold" :class="t.tipo">
                      {{ t.tipo === 'ingreso' ? '+' : '-' }} {{ formatCurrency(t.monto) }}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>

              <!-- Pagination Controls -->
              <div class="pagination-controls">
                <button 
                  class="btn btn-sm btn-outline" 
                  @click="prevPage" 
                  :disabled="pageHistory.length === 0"
                >
                  ← Anterior
                </button>
                <span class="page-info">Página {{ pageHistory.length + 1 }}</span>
                <button 
                  class="btn btn-sm btn-outline" 
                  @click="nextPage" 
                  :disabled="!nextPageToken"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Nuevo Movimiento</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Tipo de Movimiento</label>
            <div class="type-selector">
              <button 
                type="button" 
                class="type-btn" 
                :class="{ active: form.tipo === 'ingreso' }"
                @click="form.tipo = 'ingreso'"
              >
                Ingreso
              </button>
              <button 
                type="button" 
                class="type-btn" 
                :class="{ active: form.tipo === 'egreso' }"
                @click="form.tipo = 'egreso'"
              >
                Gasto
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Categoría</label>
            <input 
              type="text" 
              v-model="form.categoria" 
              placeholder="Ej: Cuotas, Cancha, Arbitraje"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>Monto</label>
            <input 
              type="number" 
              v-model="form.monto" 
              placeholder="0"
              required
              min="0"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <input 
              type="text" 
              v-model="form.descripcion" 
              placeholder="Ej: Cuotas mensuales"
              required
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label>Fecha</label>
            <input 
              type="date" 
              v-model="form.fecha" 
              required
              class="form-input"
            >
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar' }}
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

    <!-- Close Month Confirmation Modal -->
    <div v-if="showCloseMonthModal" class="modal-overlay" @click.self="showCloseMonthModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Cerrar Mes Actual</h2>
          <button class="close-btn" @click="showCloseMonthModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <p>¿Estás seguro de que deseas cerrar el mes actual?</p>
          <p class="text-muted text-sm mt-2">
            Esta acción generará un reporte financiero y congelará los movimientos del periodo.
          </p>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" @click="showCloseMonthModal = false">Cancelar</button>
          <button class="btn btn-primary" @click="handleCloseMonth" :disabled="submitting">
            {{ submitting ? 'Cerrando...' : 'Confirmar Cierre' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { clubsAPI, financeAPI } from '../api';
import BatchFinanceUpload from '../components/finanzas/BatchFinanceUpload.vue';

const route = useRoute();
const authStore = useAuthStore();
const clubStore = useClubStore();

const clubs = ref([]);
const transactions = ref([]);
const totalRegistros = ref(0);
const nextPageToken = ref(null);
const pageHistory = ref([]); // Stack of previous tokens (or null for first page)

const selectedClubId = ref('');
const filterType = ref('todos');
const loading = ref(false);
const showCreateModal = ref(false);
const showBatchUpload = ref(false);
const showCloseMonthModal = ref(false);
const submitting = ref(false);

const notification = reactive({
  show: false,
  message: '',
  type: 'info'
});

const showNotification = (msg, type = 'info') => {
  notification.message = msg;
  notification.type = type;
  notification.show = true;
  setTimeout(() => {
    notification.show = false;
  }, 3000);
};

const form = reactive({
  tipo: 'ingreso',
  categoria: '',
  monto: '',
  descripcion: '',
  fecha: new Date().toISOString().split('T')[0]
});

const totalIncome = ref(0);
const totalExpense = ref(0);
const balance = ref(0);

// Remove computed properties as we set them manually now from API
/*
const totalIncome = computed(() => 
  transactions.value
    .filter(t => t.tipo === 'INGRESO')
    .reduce((sum, t) => sum + Number(t.monto), 0)
);

const totalExpense = computed(() => 
  transactions.value
    .filter(t => t.tipo === 'EGRESO')
    .reduce((sum, t) => sum + Number(t.monto), 0)
);

const balance = computed(() => totalIncome.value - totalExpense.value);
*/

onMounted(async () => {
  await loadClubs();
  
  if (route.query.club) {
    selectedClubId.value = route.query.club;
  } else if (clubStore.selectedClub.value) {
    selectedClubId.value = clubStore.selectedClub.value.id;
  } else if (clubs.value.length > 0) {
    selectedClubId.value = clubs.value[0].id;
  }
  
  await loadTransactions();
});

const loadClubs = async () => {
  try {
    const userId = authStore.user.value?.id;
    const response = await clubsAPI.getAll({ owner_id: userId });
    // Fix: API returns array directly, or object with property depending on implementation
    clubs.value = Array.isArray(response.data) ? response.data : (response.data.clubes || []);
  } catch (error) {
    console.error('Error loading clubs:', error);
  }
};

const setFilter = async (type) => {
  if (filterType.value === type) return;
  filterType.value = type;
  pageHistory.value = []; // Reset pagination
  currentToken.value = null;
  await loadTransactions();
};

const loadTransactions = async (token = null) => {
  if (!selectedClubId.value) return;
  
  loading.value = true;
  try {
    // Parallel requests for summary and transactions
    const params = {
      ...(token ? { next: token } : {}),
      ...(filterType.value !== 'todos' ? { tipo: filterType.value } : {})
    };
    
    // Fetch summary only if loading first page (or always? efficient to check if needed)
    // The user wants the cards to be correct. The cards are global summary or current page?
    // "funcionalidad: tarjetas gastos, ingresos y balance" - implies global summary usually.
    // The previous implementation calculated from transactions, which implies it only showed visible transactions? 
    // Actually the previous implementation calculated from `transactions.value`, which was just the current page if paginated?
    // That would have been a bug if pagination existed. 
    // Now we have a dedicated endpoint for summary, which is better.
    
    const [summaryRes, transactionsRes] = await Promise.all([
        financeAPI.getFinancialSummary(selectedClubId.value),
        financeAPI.getTransactions(selectedClubId.value, params)
    ]);

    // Update Summary
    const { ingresos, egresos, balance: balanceTotal } = summaryRes.data;
    totalIncome.value = ingresos || 0;
    totalExpense.value = egresos || 0;
    balance.value = balanceTotal || 0;

    // Update Transactions List
    const response = transactionsRes;
    if (response.data && Array.isArray(response.data.data)) {
        transactions.value = response.data.data;
        totalRegistros.value = response.data.total_registros;
        nextPageToken.value = response.data.next;
    } else {
        transactions.value = response.data.movimientos || response.data || [];
        nextPageToken.value = null;
    }
  } catch (error) {
    console.error('Error loading finance data:', error);
  } finally {
    loading.value = false;
  }
};

const currentToken = ref(null);

const nextPage = async () => {
    if (nextPageToken.value) {
        pageHistory.value.push(currentToken.value);
        currentToken.value = nextPageToken.value;
        await loadTransactions(currentToken.value);
    }
};

const prevPage = async () => {
    if (pageHistory.value.length > 0) {
        const prevToken = pageHistory.value.pop();
        currentToken.value = prevToken;
        await loadTransactions(currentToken.value);
    }
};

// ... (rest of functions)
const handleSubmit = async () => {
  submitting.value = true;
  try {
    form.tipo.toLowerCase();
    await financeAPI.createTransaction(selectedClubId.value, {
      ...form,
      monto: Number(form.monto)
    });

    await loadTransactions();
    closeModal();
    showNotification('Movimiento registrado exitosamente', 'success');
  } catch (error) {
    console.error('Error creating transaction:', error);
    showNotification('Error al registrar el movimiento', 'error');
  } finally {
    submitting.value = false;
  }
};

const handleBatchComplete = async () => {
  showBatchUpload.value = false;
  await loadTransactions();
};

const handleBatchNotify = ({ message, type }) => {
  showNotification(message, type);
};

const handleCloseMonth = async () => {
  submitting.value = true;
  try {
    await financeAPI.closeMonth(selectedClubId.value, {
      fecha: new Date().toISOString()
    });
    showNotification('Mes cerrado exitosamente', 'success');
    showCloseMonthModal.value = false;
    await loadTransactions();
  } catch (error) {
    console.error('Error closing month:', error);
    showNotification('Error al cerrar el mes', 'error');
  } finally {
    submitting.value = false;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  form.tipo = 'ingreso';
  form.categoria = '';
  form.monto = '';
  form.descripcion = '';
  form.fecha = new Date().toISOString().split('T')[0];
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped>
/* Mobile Cards Styles */
.mobile-cards-view {
  display: none;
  flex-direction: column;
  gap: var(--spacing-md);
}

.transaction-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.transaction-card.ingreso {
  border-left: 4px solid #10b981;
}

.transaction-card.egreso {
  border-left: 4px solid #ef4444;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.card-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  font-size: 0.9rem;
}

.transaction-card.ingreso .card-type { color: #10b981; }
.transaction-card.egreso .card-type { color: #ef4444; }

.card-amount {
  font-weight: 700;
  font-size: 1.1rem;
}

.card-amount.ingreso { color: #10b981; }
.card-amount.egreso { color: #ef4444; }

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.card-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.card-label {
  color: var(--text-muted);
}

.card-value {
  color: var(--text-primary);
  text-align: right;
  font-weight: 500;
}

.card-footer {
  text-align: right;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

/* Responsive Visibility */
@media (max-width: 768px) {
  .desktop-table-view {
    display: none;
  }
  
  .mobile-cards-view {
    display: flex;
  }
  
  .finance-table {
    display: none; /* Double check to hide table elements */
  }
}

/* Keeping existing styles and adding table styles */
.finance-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.inline {
  display: inline-block;
  margin: 0;
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
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.club-select {
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  min-width: 200px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.summary-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.summary-card.income .summary-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.summary-card.expense .summary-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.summary-card.balance .summary-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-info .label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.summary-info .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-info .value.negative {
  color: #ef4444;
}

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
  gap: var(--spacing-sm);
}

.section-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.filter-controls {
  display: flex;
  gap: var(--spacing-xs);
  background: var(--bg-card);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.filter-btn {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.filter-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.total-badge {
  background: var(--bg-card);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.transactions-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
}

.transactions-section h2 {
  margin: 0;
  font-size: 1.25rem;
}

/* Table Styles */
.finance-table {
  width: 100%;
  border-collapse: collapse;
}

.finance-table th {
  text-align: left;
  padding: var(--spacing-md);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--border-color);
}

.finance-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.95rem;
}

.finance-table tbody tr:hover {
  background: var(--bg-hover);
}

.cell-desc {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.ingreso {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.badge.egreso {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.text-right { text-align: right; }
.font-bold { font-weight: 700; }
.text-muted { color: var(--text-muted); }
.text-sm { font-size: 0.875rem; }

.text-right.INGRESO { color: #10b981; }
.text-right.EGRESO { color: #f97316; }

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-xl);
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

/* Modal and Form Styles */
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

.type-selector {
  display: flex;
  gap: var(--spacing-md);
}

.type-btn {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-muted);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
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
  
  .action-buttons {
    width: 100%;
  }
  
  .action-buttons .btn {
    flex: 1;
  }
  
  .finance-table {
      display: block;
      overflow-x: auto;
  }
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
  opacity: 0.8;
  cursor: pointer;
  font-size: 1.25rem;
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

/* Modal Body Text */
.modal-body p {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.modal-body .text-muted {
  color: var(--text-muted);
}
</style>
