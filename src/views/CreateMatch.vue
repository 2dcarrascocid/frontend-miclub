<template>
  <div class="create-match-page">
    <div class="container">
      <div class="page-header">
        <router-link to="/matches" class="back-button">
          ← Volver
        </router-link>
        <h1>⚽ Crear Nuevo Partido</h1>
        <p>Organiza un partido y invita a tus amigos</p>
      </div>

      <div class="form-container">
        <form @submit.prevent="handleSubmit" class="match-form">
          <div class="form-section">
            <h2>Información Básica</h2>
            
            <div class="form-group">
              <label for="nombre" class="form-label">Nombre del Partido</label>
              <input
                id="nombre"
                v-model="formData.nombre"
                type="text"
                class="form-input"
                placeholder="Ej: Partido de Fútbol 5"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="fecha" class="form-label">Fecha y Hora</label>
                <input
                  id="fecha"
                  v-model="formData.fecha"
                  type="datetime-local"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="max_jugadores" class="form-label">Máx. Jugadores</label>
                <input
                  id="max_jugadores"
                  v-model.number="formData.max_jugadores"
                  type="number"
                  class="form-input"
                  placeholder="10"
                  min="2"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="ubicacion" class="form-label">Ubicación</label>
              <input
                id="ubicacion"
                v-model="formData.ubicacion"
                type="text"
                class="form-input"
                placeholder="Ej: Cancha Municipal, Santiago"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="latitud" class="form-label">Latitud</label>
                <input
                  id="latitud"
                  v-model.number="formData.latitud"
                  type="number"
                  step="0.000001"
                  class="form-input"
                  placeholder="-33.4489"
                />
              </div>

              <div class="form-group">
                <label for="longitud" class="form-label">Longitud</label>
                <input
                  id="longitud"
                  v-model.number="formData.longitud"
                  type="number"
                  step="0.000001"
                  class="form-input"
                  placeholder="-70.6693"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2>Detalles Adicionales</h2>

            <div class="form-group">
              <label for="descripcion" class="form-label">Descripción</label>
              <textarea
                id="descripcion"
                v-model="formData.descripcion"
                class="form-textarea"
                placeholder="Describe el partido, nivel de juego, etc."
                rows="4"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="costo" class="form-label">Costo por Jugador</label>
                <input
                  id="costo"
                  v-model.number="formData.costo"
                  type="number"
                  class="form-input"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label for="estado" class="form-label">Estado</label>
                <select id="estado" v-model="formData.estado" class="form-select">
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="form-actions">
            <router-link to="/matches" class="btn btn-secondary">
              Cancelar
            </router-link>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Crear Partido</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { matchesAPI } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  nombre: '',
  fecha: '',
  ubicacion: '',
  latitud: null,
  longitud: null,
  max_jugadores: 10,
  descripcion: '',
  costo: 0,
  estado: 'pendiente',
  owner_id: authStore.user.value?.id,
});

const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';

  try {
    // Convertir fecha a ISO string
    const matchData = {
      ...formData.value,
      fecha: new Date(formData.value.fecha).toISOString(),
    };

    await matchesAPI.create(matchData);
    router.push('/matches');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al crear el partido';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.create-match-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-base);
}

.back-button:hover {
  color: var(--primary-light);
  transform: translateX(-4px);
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

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.match-form {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-md);
}

.form-section {
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-2xl);
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-lg);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .match-form {
    padding: var(--spacing-xl);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
