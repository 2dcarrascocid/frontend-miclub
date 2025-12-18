<template>
  <div class="batch-upload-modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Carga Masiva de Jugadores</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- Step 1: Download Template -->
        <div class="step-section">
          <h3>1. Descargar Plantilla</h3>
          <p>Descarga el archivo Excel con el formato requerido.</p>
          <button class="btn btn-secondary" @click="downloadTemplate" :disabled="loading">
            📥 Descargar Plantilla
          </button>
        </div>

        <!-- Step 2: Upload File -->
        <div class="step-section">
          <h3>2. Subir Archivo</h3>
          <p>Sube el archivo Excel completado.</p>
          <div class="file-upload-wrapper">
            <input 
              type="file" 
              ref="fileInput" 
              accept=".xlsx, .xls" 
              @change="handleFileSelect"
              class="file-input"
            />
          </div>
        </div>

        <!-- Results -->
        <div v-if="result" class="results-section">
          <div class="alert" :class="result.resumen.total_errores > 0 ? 'alert-warning' : 'alert-success'">
            <h4>Proceso Completado</h4>
            <p>Procesados: {{ result.resumen.total_procesados }}</p>
            <p>Insertados: {{ result.resumen.total_insertados }}</p>
            <p>Errores: {{ result.resumen.total_errores }}</p>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-text" @click="$emit('close')">Cerrar</button>
        <button 
          class="btn btn-primary" 
          @click="processUpload" 
          :disabled="!selectedFile || loading"
        >
          {{ loading ? 'Procesando...' : 'Procesar Carga' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { playersAPI } from '../../api';

const props = defineProps({
  clubId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'success']);

const loading = ref(false);
const error = ref(null);
const selectedFile = ref(null);
const result = ref(null);

const downloadTemplate = async () => {
  try {
    loading.value = true;
    const response = await playersAPI.downloadTemplate(props.clubId);
    downloadBase64File(response.data.file_base64, response.data.file_name);
  } catch (err) {
    error.value = 'Error al descargar plantilla';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    result.value = null;
    error.value = null;
  }
};

const processUpload = async () => {
  if (!selectedFile.value) return;

  try {
    loading.value = true;
    error.value = null;

    const base64 = await fileToBase64(selectedFile.value);
    const base64Content = base64.split(',')[1] || base64;

    const response = await playersAPI.bulkUpload(props.clubId, {
      file_base64: base64Content
    });

    result.value = response.data;
    emit('success'); // Notify parent to refresh list
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al procesar la carga';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Utilities
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const downloadBase64File = (base64, fileName, contentType) => {
  const link = document.createElement('a');
  // Auto-detect content type if not provided for template (default xlsx)
  const mimeType = contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.batch-upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card, white);
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  color: var(--text-primary, #333);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
}

.step-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 8px;
}

.results-section {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
}

.alert {
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f8d7da;
  border-radius: 4px;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color, #eee);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-weight: 500;
}

.btn-primary {
  background: var(--primary-color, #007bff);
  color: white;
}

.btn-secondary {
  background: var(--secondary-color, #6c757d);
  color: white;
}

.btn-text {
  background: none;
  color: var(--text-secondary, #6c757d);
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed var(--border-color, #ccc);
  border-radius: 4px;
}
</style>
