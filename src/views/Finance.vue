<template>
  <div class="finance-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>💰 Finanzas</h1>
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
            <button class="btn btn-outline" @click="closeMonth" :disabled="!selectedClubId">
              📅 Cerrar Mes
            </button>
            <button 
              class="btn btn-secondary" 
              @click="showBatchUpload = !showBatchUpload" 
              :disabled="!selectedClubId"
              :class="{ active: showBatchUpload }"
            >
              📊 {{ showBatchUpload ? 'Ver Lista' : 'Carga por Lotes' }}
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
              <h2>Movimientos Recientes</h2>
              <span class="total-badge" v-if="totalRegistros">{{ totalRegistros }} registros</span>
            </div>
            
            <div v-if="transactions.length === 0" class="empty-list">
              <p>No hay movimientos registrados en este periodo</p>
            </div>

            <div v-else class="table-responsive">
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
                :class="{ active: form.tipo === 'INGRESO' }"
                @click="form.tipo = 'INGRESO'"
              >
                Ingreso
              </button>
              <button 
                type="button" 
                class="type-btn" 
                :class="{ active: form.tipo === 'EGRESO' }"
                @click="form.tipo = 'EGRESO'"
              >
                Gasto
              </button>
            </div>
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
const loading = ref(false);
const showCreateModal = ref(false);
const showBatchUpload = ref(false);
const submitting = ref(false);

const form = reactive({
  tipo: 'INGRESO',
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
    clubs.value = response.data.clubes || [];
  } catch (error) {
    console.error('Error loading clubs:', error);
  }
};

const loadTransactions = async (token = null) => {
  if (!selectedClubId.value) return;
  
  loading.value = true;
  try {
    // Parallel requests for summary and transactions
    const params = token ? { next: token } : {};
    
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
    await financeAPI.createTransaction(selectedClubId.value, {
      ...form,
      monto: Number(form.monto)
    });

    await loadTransactions();
    closeModal();
  } catch (error) {
    console.error('Error creating transaction:', error);
    alert('Error al crear el movimiento');
  } finally {
    submitting.value = false;
  }
};

const handleBatchComplete = async () => {
  showBatchUpload.value = false;
  await loadTransactions();
};

const closeMonth = async () => {
  if (!confirm('¿Estás seguro de cerrar el mes actual? Esto generará un reporte.')) return;
  
  try {
    await financeAPI.closeMonth(selectedClubId.value, {
      fecha: new Date().toISOString()
    });
    alert('Mes cerrado exitosamente');
    await loadTransactions();
  } catch (error) {
    console.error('Error closing month:', error);
    alert('Error al cerrar el mes');
  }
};

const closeModal = () => {
  showCreateModal = false;
  form.tipo = 'INGRESO';
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
/* Keeping existing styles and adding table styles */
.finance-page {
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
}

.total-badge {
    background: var(--bg-secondary);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.875rem;
    color: var(--text-secondary);
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
</style>
