<template>
  <div class="batch-upload-container">
    <div class="batch-header">
      <h3>📥 Carga por Lote</h3>
      <p>Ingresa múltiples movimientos financieros simultáneamente (Máx. 20)</p>
    </div>

    <!-- Batch Description -->
    <div class="form-group batch-title-group">
      <label>Título del Lote (Descripción General)</label>
      <input 
        type="text" 
        v-model="batchTitle" 
        placeholder="Ej: FECHA 1 APERTURA 2026" 
        class="form-input"
      >
      <small class="text-muted">Se asignará a todos los registros como descripción</small>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="batch-table">
        <thead>
          <tr>
            <th width="50">#</th>
            <th width="120">Tipo</th>
            <th width="200">Categoría</th>
            <th width="150">Monto</th>
            <th width="300">Jugador (Buscador)</th>
            <th width="50"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <select v-model="row.tipo" class="form-select text-sm">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </td>
            <td>
              <input 
                type="text" 
                v-model="row.categoria" 
                placeholder="Ej: Pago camiseta" 
                class="form-input text-sm"
              >
            </td>
            <td>
              <input 
                type="number" 
                v-model="row.monto" 
                placeholder="0" 
                class="form-input text-sm"
                min="0"
              >
            </td>
            <td class="relative">
              <!-- Player Autocomplete -->
              <div class="autocomplete-wrapper">
                <input 
                  type="text" 
                  v-model="row.playerSearch" 
                  @input="onSearchInput(index)"
                  placeholder="Buscar socio/jugador..." 
                  class="form-input text-sm"
                  :class="{ 'valid-player': row.jugador_id }"
                >
                <span v-if="row.jugador_id" class="check-icon">✓</span>
                
                <!-- Dropdown -->
                <div v-if="row.showDropdown && row.searchResults.length > 0" class="dropdown-results">
                  <div 
                    v-for="player in row.searchResults" 
                    :key="player.id" 
                    class="dropdown-item"
                    @click="selectPlayer(index, player)"
                  >
                    <div class="player-name">{{ player.nombre_completo }}</div>
                    <div class="player-meta">{{ player.rut }} - {{ player.folio ? 'Folio: ' + player.folio : '' }}</div>
                  </div>
                </div>
                 <div v-if="row.showDropdown && row.searchResults.length === 0 && row.isSearching" class="dropdown-results">
                    <div class="dropdown-item no-results">Buscando...</div>
                 </div>
                 <div v-if="row.showDropdown && row.searchResults.length === 0 && !row.isSearching && row.playerSearch.length >= 2" class="dropdown-results">
                    <div class="dropdown-item no-results">No se encontraron resultados</div>
                 </div>
              </div>
            </td>
            <td>
              <button class="btn-icon delete-btn" @click="removeRow(index)" title="Eliminar fila">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Actions -->
    <div class="batch-actions">
      <button class="btn btn-outline" @click="addRow" :disabled="rows.length >= 20">
        + Agregar Fila
      </button>
      <div class="action-right">
         <span class="total-summary">
            Total Registros: {{ rows.length }}
         </span>
         <button class="btn btn-primary" @click="submitBatch" :disabled="submitting || rows.length === 0">
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

const emit = defineEmits(['completed']);

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
  if (rows.value.length < 20) {
    rows.value.push(createEmptyRow());
  }
};

const removeRow = (index) => {
  rows.value.splice(index, 1);
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
      // Assuming response.data is the array directly based on backend implementation
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

// Click outside to close dropdowns - Simple implementation
// For a robust app, use a directive, but here we can just close on row interactions or use a transparent overlay if needed.
// For now, let's rely on selecting or blurring. Actually, blur is tricky with click.
// We will just let it stay open until selection or backspace.

const submitBatch = async () => {
  if (!batchTitle.value) {
    alert('Debes ingresar un Título para el Lote');
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
      alert('No hay filas válidas para procesar');
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
      // fecha_movimiento default to now in backend if not sent, or send formatted date
      fecha_movimiento: new Date().toISOString()
    }));

    await financeAPI.createBatch(props.clubId, payload);
    alert('Lote procesado exitosamente');
    
    // Reset
    batchTitle.value = '';
    rows.value = [createEmptyRow()];
    emit('completed');
  } catch (error) {
    console.error('Error batch upload:', error);
    alert('Ocurrió un error al procesar el lote');
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
  animation: fadeIn 0.3s ease-out;
}

.batch-header {
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-md);
}

.batch-title-group {
    max-width: 500px;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.batch-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.batch-table th {
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-weight: 600;
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.85rem;
}

.batch-table td {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  vertical-align: top;
}

.text-sm {
    font-size: 0.9rem;
    padding: 0.5rem;
}

/* Autocomplete Styles */
.autocomplete-wrapper {
  position: relative;
}

.valid-player {
    border-color: var(--accent-green) !important;
    padding-right: 2rem;
}

.check-icon {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--accent-green);
    font-weight: bold;
    pointer-events: none;
}

.dropdown-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: var(--shadow-lg);
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
}

.player-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.no-results {
    color: var(--text-muted);
    font-style: italic;
    cursor: default;
}

.delete-btn {
  background: none;
  border: none;
  color: var(--accent-red);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}
.delete-btn:hover {
    color: #ff0000;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.action-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.total-summary {
    color: var(--text-secondary);
    font-weight: 500;
}
</style>
