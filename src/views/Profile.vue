<template>
  <div class="profile-page">
    <div class="container">
      <div class="page-header">
        <h2 class="inline">👤</h2>
        <h1 class="inline">Mi Perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>

      <div class="profile-content">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar-large">
              <img v-if="userPhoto" :src="userPhoto" alt="Avatar" class="avatar-img">
              <span v-else>{{ userInitials }}</span>
            </div>
            <div class="profile-info">
              <h2>{{ displayName }}</h2>
              <p>{{ user?.email }}</p>
            </div>
          </div>

          <div class="profile-details">
            <h3>Información Personal</h3>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Nombre</span>
                <span class="detail-value">{{ user?.metadata?.nombre || user?.nombre || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Apellido</span>
                <span class="detail-value">{{ user?.metadata?.apellido || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ user?.email || 'No especificado' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Teléfono</span>
                <span class="detail-value">{{ user?.telefono || 'No especificado' }}</span>
              </div>
            </div>
          </div>

          <div class="profile-actions">
            <button class="btn btn-primary" @click="openEditModal">
              ✏️ Editar Perfil
            </button>
            <button @click="handleLogout" class="btn btn-danger">
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      <span class="notification-icon">{{ notification.type === 'success' ? '✅' : (notification.type === 'error' ? '⚠️' : 'ℹ️') }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button class="notification-close" @click="notification.show = false">×</button>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Editar Perfil</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input 
              type="text" 
              v-model="form.nombre" 
              placeholder="Tu nombre"
              class="form-input"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Apellido</label>
            <input 
              type="text" 
              v-model="form.apellido" 
              placeholder="Tu apellido"
              class="form-input"
            >
          </div>

          <!-- <div class="form-group">
            <label class="form-label">Foto de Perfil</label>
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
          </div> -->

          <div class="form-actions">
            <button type="button" class="btn btn-outline" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authAPI } from '../api';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user.value);
const loading = ref(false);
const showEditModal = ref(false);
const submitting = ref(false);
const selectedFile = ref(null);
const previewImage = ref(null);

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

const form = reactive({
  nombre: '',
  apellido: '',
  path_foto: null
});

const userInitials = computed(() => {
  const name = user.value?.metadata?.nombre || user.value?.nombre || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const userPhoto = computed(() => {
    return user.value?.metadata?.path_foto || user.value?.path_foto || null;
});

const displayName = computed(() => {
    const meta = user.value?.metadata || {};
    if (meta.nombre && meta.apellido) return `${meta.nombre} ${meta.apellido}`;
    return meta.nombre || user.value?.nombre || 'Usuario';
});

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  try {
    const response = await authAPI.getProfile();
    // Update store with fresh data
    if (response.data && response.data.usuario) {
        authStore.updateUserData(response.data.usuario);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};

const openEditModal = () => {
  const userData = user.value;
  const metadata = userData?.metadata || {};
  
  form.nombre = metadata.nombre || userData?.nombre || '';
  form.apellido = metadata.apellido || userData?.apellido || '';
  form.path_foto = metadata.path_foto || userData?.path_foto || null;
  
  previewImage.value = null;
  selectedFile.value = null;
  showEditModal.value = true;
};

const closeModal = () => {
  showEditModal.value = false;
  selectedFile.value = null;
  previewImage.value = null;
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// SHA-1 helper
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
    throw new Error('Variables de entorno de Cloudinary no configuradas');
  }

  const timestamp = Math.round((new Date()).getTime() / 1000);
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
    if (selectedFile.value) {
      const imageUrl = await uploadToCloudinary(selectedFile.value);
      form.path_foto = imageUrl;
    }

    const response = await authAPI.updateProfile(form);
    
    if (response.data && response.data.usuario) {
        authStore.updateUserData(response.data.usuario);
        showNotification('Perfil actualizado correctamente', 'success');
        closeModal();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    showNotification('Error al actualizar perfil: ' + (error.message || 'Error desconocido'), 'error');
  } finally {
    submitting.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: var(--spacing-2xl);
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

.profile-content {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
  position: relative;
}

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

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
  padding-bottom: var(--spacing-2xl);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-2xl);
}

.profile-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  box-shadow: var(--shadow-glow);
  flex-shrink: 0;
}

.profile-info h2 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 1.75rem;
}

.profile-info p {
  margin: 0;
  color: var(--text-muted);
}

.profile-details {
  margin-bottom: var(--spacing-2xl);
}

.profile-details h3 {
  margin-bottom: var(--spacing-lg);
  font-size: 1.25rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.profile-actions {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    flex-direction: column;
  }

  .profile-actions .btn {
    width: 100%;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.modal-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--border-color);
}
.inline {
  display: inline-block;
  margin: 0;
}
</style>
