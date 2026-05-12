<template>
  <div class="batch-upload-container">
    <div class="batch-header">
      <div class="header-content">
        <h3>📥 Carga Planilla de Movimientos</h3>
        <p>Registra múltiples ingresos o egresos en una sola operación</p>
      </div>
      <div class="batch-title-wrapper">
        <label>Referencia del Lote:</label>
        <input 
          type="text" 
          v-model="batchTitle" 
          placeholder="Ej: CUOTAS MARZO 2025" 
          class="form-input batch-title-input"
        >
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <!-- Desktop Table -->
      <table class="batch-table desktop-only">
        <thead>
          <tr>
            <th class="col-index">#</th>
            <th class="col-type">Tipo</th>
            <th class="col-category">Categoría</th>
            <th class="col-amount">Monto</th>
            <th class="col-player">Jugador / Socio</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index" :class="{ 'row-filled': isRowFilled(row) }">
            <td class="text-center text-muted">{{ index + 1 }}</td>
            <td>
              <select v-model="row.tipo" class="table-input select-type" :class="row.tipo">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </td>
            <td>
              <input 
                type="text" 
                v-model="row.categoria" 
                placeholder="Categoría..." 
                class="table-input"
              >
            </td>
            <td>
              <div class="amount-wrapper">
                <span class="currency-symbol">$</span>
                <input 
                  type="number" 
                  v-model="row.monto" 
                  placeholder="0" 
                  class="table-input amount-input"
                  min="0"
                >
              </div>
            </td>
            <td class="relative cell-player">
              <!-- Player Autocomplete -->
              <div class="autocomplete-wrapper">
                <input 
                  type="text" 
                  v-model="row.playerSearch" 
                  @input="onSearchInput(index)"
                  placeholder="Buscar por nombre, rut o folio..." 
                  class="table-input search-input"
                  :class="{ 'valid-player': row.jugador_id }"
                >
                <span v-if="row.jugador_id" class="check-icon" title="Jugador seleccionado">✓</span>
                
                <!-- Dropdown -->
                <div v-if="row.showDropdown && row.searchResults.length > 0" class="dropdown-results">
                  <div 
                    v-for="player in row.searchResults" 
                    :key="player.id" 
                    class="dropdown-item"
                    @click="selectPlayer(index, player)"
                  >
                    <div class="player-name">{{ player.nombre_completo }}</div>
                    <div class="player-meta">{{ player.rut }} <span v-if="player.folio">• Folio: {{ player.folio }}</span></div>
                  </div>
                </div>
                 <div v-if="row.showDropdown && row.searchResults.length === 0 && row.isSearching" class="dropdown-results">
                    <div class="dropdown-item no-results">Buscando...</div>
                 </div>
                 <div v-if="row.showDropdown && row.searchResults.length === 0 && !row.isSearching && row.playerSearch.length >= 2" class="dropdown-results">
                    <div class="dropdown-item no-results">No encontrado</div>
                 </div>
              </div>
            </td>
            <td class="text-center">
              <button class="btn-icon delete-btn" @click="removeRow(index)" title="Eliminar fila" v-if="rows.length > 1">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Cards -->
      <div class="mobile-batch-cards mobile-only">
        <div v-for="(row, index) in rows" :key="index" class="batch-card" :class="{ 'row-filled': isRowFilled(row) }">
          <div class="batch-card-header">
            <span class="row-number">#{{ index + 1 }}</span>
            <button class="btn-icon delete-btn" @click="removeRow(index)" title="Eliminar fila" v-if="rows.length > 1">
              🗑️
            </button>
          </div>
          
          <div class="batch-card-body">
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="row.tipo" class="table-input select-type" :class="row.tipo">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>

            <div class="form-group">
              <label>Monto</label>
              <div class="amount-wrapper">
                <span class="currency-symbol">$</span>
                <input 
                  type="number" 
                  v-model="row.monto" 
                  placeholder="0" 
                  class="table-input amount-input"
                  min="0"
                >
              </div>
            </div>

            <div class="form-group">
              <label>Categoría</label>
              <input 
                type="text" 
                v-model="row.categoria" 
                placeholder="Categoría..." 
                class="table-input"
              >
            </div>

            <div class="form-group">
              <label>Jugador</label>
              <div class="autocomplete-wrapper">
                <input 
                  type="text" 
                  v-model="row.playerSearch" 
                  @input="onSearchInput(index)"
                  placeholder="Buscar jugador..." 
                  class="table-input search-input"
                  :class="{ 'valid-player': row.jugador_id }"
                >
                <span v-if="row.jugador_id" class="check-icon mobile-check" title="Jugador seleccionado">✓</span>
                
                <!-- Dropdown -->
                <div v-if="row.showDropdown && row.searchResults.length > 0" class="dropdown-results">
                  <div 
                    v-for="player in row.searchResults" 
                    :key="player.id" 
                    class="dropdown-item"
                    @click="selectPlayer(index, player)"
                  >
                    <div class="player-name">{{ player.nombre_completo }}</div>
                    <div class="player-meta">{{ player.rut }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="batch-footer">
      <button class="btn btn-secondary add-btn" @click="addRow" :disabled="rows.length >= 50">
        <span class="icon">+</span> Agregar Fila
      </button>
      
      <div class="footer-summary">
         <div class="summary-item">
           <span class="label">Registros:</span>
           <span class="value">{{ rows.length }}</span>
         </div>
         <div class="summary-item total">
           <span class="label">Total:</span>
           <span class="value">{{ formatCurrency(calculateTotal()) }}</span>
         </div>
         <button class="btn btn-primary process-btn" @click="submitBatch" :disabled="submitting || rows.length === 0">
           {{ submitting ? 'Guardando...' : '💾 Procesar Lote' }}
         </button>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { playersAPI, financeAPI } from '../../api';


const props = defineProps({
  clubId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['completed', 'notify']);

const batchTitle = ref('');
const submitting = ref(false);

const createEmptyRow = () => ({
  tipo: 'ingreso',
  categoria: '',
  monto: '',
  playerSearch: '',
  jugador_id: null,
  searchResults: [],
  showDropdown: false,
  isSearching: false,
  timer: null
});

const rows = ref([createEmptyRow()]);

const addRow = () => {
  if (rows.value.length < 50) {
    rows.value.push(createEmptyRow());
  }
};

const removeRow = (index) => {
  rows.value.splice(index, 1);
};

const isRowFilled = (row) => {
  return row.monto && row.jugador_id;
};

const calculateTotal = () => {
  return rows.value.reduce((sum, row) => sum + (Number(row.monto) || 0), 0);
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

// Autocomplete Logic
const onSearchInput = (index) => {
  const row = rows.value[index];
  row.jugador_id = null; // Reset selection on edit
  row.showDropdown = true;
  
  if (row.timer) clearTimeout(row.timer);
  
  if (row.playerSearch.length < 2) {
    row.searchResults = [];
    row.showDropdown = false;
    return;
  }

  row.isSearching = true;
  row.timer = setTimeout(async () => {
    try {
      const response = await playersAPI.search(props.clubId, row.playerSearch);
      row.searchResults = response.data || [];
    } catch (error) {
      console.error("Search error", error);
      row.searchResults = [];
    } finally {
      row.isSearching = false;
    }
  }, 300); // Debounce 300ms
};

const selectPlayer = (index, player) => {
  const row = rows.value[index];
  row.playerSearch = player.nombre_completo;
  row.jugador_id = player.id;
  row.showDropdown = false;
};

const submitBatch = async () => {
  if (!batchTitle.value) {
    emit('notify', { message: 'Debes ingresar una Referencia para el Lote', type: 'warning' });
    return;
  }

  // Validate rows
  const validRows = rows.value.filter(r => r.monto && r.tipo && r.jugador_id);
  if (validRows.length !== rows.value.length) {
    if (!confirm('Algunas filas están incompletas (falta monto o jugador). ¿Deseas procesar solo las filas completas?')) {
        return;
    }
  }

  if (validRows.length === 0) {
      emit('notify', { message: 'No hay filas válidas para procesar', type: 'warning' });
      return;
  }

  submitting.value = true;
  try {
    const payload = validRows.map(r => ({
      club_id: props.clubId,
      tipo: r.tipo,
      categoria: r.categoria || 'General',
      monto: Number(r.monto),
      descripcion: batchTitle.value,
      jugador_id: r.jugador_id,
      fecha_movimiento: new Date().toISOString()
    }));

    await financeAPI.createBatch(props.clubId, payload);
    emit('notify', { message: 'Lote procesado exitosamente', type: 'success' });
    
    // Reset
    batchTitle.value = '';
    rows.value = [createEmptyRow()];
    emit('completed');
  } catch (error) {
    console.error('Error batch upload:', error);
    emit('notify', { message: 'Ocurrió un error al procesar el lote', type: 'error' });
  } finally {
    submitting.value = false;
  }
};

</script>

<style scoped>
.batch-upload-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  margin-top: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  animation: fadeIn 0.3s ease-out;
}

/* Header Styles */
.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.header-content p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.batch-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 300px;
  background: var(--bg-secondary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  max-width: 500px;
}

/* Mobile Cards Styles */
.mobile-batch-cards {
  display: none;
  flex-direction: column;
  gap: var(--spacing-md);
}

.batch-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  position: relative;
}

.batch-card.row-filled {
  border-left: 4px solid #10b981;
}

.batch-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.row-number {
  font-weight: bold;
  color: var(--text-muted);
}

.batch-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.batch-card-body .form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.batch-card-body label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.mobile-check {
    right: 10px;
    top: 38px; /* Adjust based on input height */
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-batch-cards {
    display: flex;
  }
  
  .batch-upload-container {
    padding: var(--spacing-md);
  }
  
  .batch-footer {
    flex-direction: column-reverse;
  }
  
  .footer-summary {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-item {
    justify-content: space-between;
  }
  
  .add-btn {
      width: 100%;
      margin-top: var(--spacing-md);
  }
}

.batch-title-wrapper label {
  white-space: nowrap;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.batch-title-input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  outline: none;
}

.batch-title-input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

/* Table Styles */
.table-container {
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden; /* Clips corners */
  background: var(--bg-surface);
}

.batch-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px; /* Ensures scrolling on small screens */
}

.batch-table th {
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-color);
}

/* Column Widths */
.col-index { width: 50px; text-align: center; }
.col-type { width: 140px; }
.col-category { width: 20%; }
.col-amount { width: 15%; }
.col-player { width: auto; } /* Takes remaining space */
.col-action { width: 60px; }

.batch-table td {
  padding: 0; /* Remove default padding for input full fill */
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  transition: background 0.2s;
}

.batch-table tr:last-child td {
  border-bottom: none;
}

.batch-table tr:hover td {
  background: var(--bg-hover);
}

.row-filled td {
  background: rgba(var(--primary-rgb), 0.02);
}

/* Table Inputs */
.table-input {
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
}

.table-input:focus {
  background: var(--bg-card);
  box-shadow: inset 0 0 0 2px var(--primary-color);
}

/* Specific Input Styles */
.select-type {
  cursor: pointer;
  font-weight: 500;
}
.select-type.ingreso { color: var(--accent-green); }
.select-type.egreso { color: var(--accent-red); }

.amount-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.amount-input {
  padding-left: 2rem;
  font-family: monospace;
  font-weight: 600;
}

.cell-player {
  position: relative;
}

.search-input {
  padding-right: 2.5rem;
}

.valid-player {
  color: var(--accent-green);
  font-weight: 600;
}

/* Footer & Actions */
.batch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.footer-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.summary-item .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.summary-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-item.total .value {
  color: var(--primary-color);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-md);
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
}

/* Autocomplete Dropdown */
.autocomplete-wrapper {
  position: relative;
}

.dropdown-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: var(--shadow-xl);
}

.dropdown-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.1rem;
}

.player-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.check-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--accent-green);
  font-weight: bold;
  pointer-events: none;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .batch-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-title-wrapper {
    width: 100%;
    min-width: 0;
  }
  
  .batch-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .footer-summary {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  .process-btn {
    width: 100%;
    margin-top: var(--spacing-md);
  }
}
</style>
