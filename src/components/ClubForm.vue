<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label class="form-label">Nombre del Club</label>
      <input 
        type="text" 
        v-model="form.nombre" 
        placeholder="Ej: Los Galácticos FC"
        required
        maxlength="100"
        class="form-input"
      >
    </div>

    <div class="form-group">
      <label class="form-label">Descripción</label>
      <textarea 
        v-model="form.descripcion" 
        placeholder="Descripción breve del club..."
        maxlength="200"
        class="form-textarea"
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Deporte</label>
      <select v-model="form.deporte" class="form-select" required>
        <option v-for="opt in sportOptions" :key="opt.value" :value="opt.value">
          {{ opt.icon }} {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Logo del Club</label>
      <div class="file-upload-container">
        <input 
          type="file" 
          @change="handleFileChange" 
          accept="image/*"
          class="file-input"
        >
        <div v-if="previewImage || form.path_foto" class="image-preview mt-2">
          <img :src="previewImage || form.path_foto" alt="Vista previa" class="preview-img">
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button v-if="showCancel" type="button" class="btn btn-outline" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Club') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import axios from 'axios';
import sportOptions from '../../sport-options.json';
import { useAuthStore } from '../stores/auth';
import { clubsAPI } from '../api';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  showCancel: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['success', 'cancel']);

const authStore = useAuthStore();
const submitting = ref(false);
const selectedFile = ref(null);
const previewImage = ref(null);

const form = reactive({
  nombre: '',
  descripcion: '',
  path_foto: null,
  deporte: 'futbol'
});

// Initialize form when initialData changes or on mount
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    form.nombre = newData.nombre || '';
    form.descripcion = newData.descripcion || '';
    form.path_foto = newData.path_foto || null;
    form.deporte = newData.deporte || 'futbol';
  } else {
    // Reset form
    form.nombre = '';
    form.descripcion = '';
    form.path_foto = null;
    form.deporte = 'futbol';
  }
}, { immediate: true });

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Simple SHA-1 helper using Web Crypto API
async function sha1(str) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map(v => v.toString(16).padStart(2, '0'))
    .join('');
}

const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
  
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables missing');
  }

  const timestamp = Math.round((new Date()).getTime() / 1000);
  
  // Generate signature
  const msg = `timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1(msg);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  
  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, 
    formData
  );
  
  return response.data.secure_url;
};

const handleSubmit = async () => {
  submitting.value = true;
  try {
    // Upload image if selected
    if (selectedFile.value) {
      const imageUrl = await uploadToCloudinary(selectedFile.value);
      form.path_foto = imageUrl;
    }

    if (props.isEditing) {
      await clubsAPI.update({
        id: props.initialData.id,
        nombre: form.nombre,
        descripcion: form.descripcion,
        path_foto: form.path_foto,
        deporte: form.deporte
      });
    } else {
      // Construct payload according to requirements
      const clubData = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        path_foto: form.path_foto || '/', // Default to '/' if no image, as per example
        deporte: form.deporte,
        owner_id: authStore.user.value?.id,
        admin_id: authStore.user.value?.id
      };
      await clubsAPI.create(clubData);
    }

    emit('success');
  } catch (error) {
    console.error('Error saving club:', error);
    alert('Error al guardar el club: ' + (error.message || 'Error desconocido'));
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-color);
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
