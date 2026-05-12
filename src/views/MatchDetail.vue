<template>
  <div class="match-detail-page">
    <div class="container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando detalles...</p>
      </div>

      <div v-else-if="match" class="match-detail">
        <div class="page-header">
          <router-link to="/matches" class="back-button">
            ← Volver a Partidos
          </router-link>
        </div>

        <div class="match-hero">
          <div class="match-hero-content">
            <div class="match-date-large">
              <span class="day">{{ formatDay(match.fecha) }}</span>
              <span class="month">{{ formatMonth(match.fecha) }}</span>
              <span class="year">{{ formatYear(match.fecha) }}</span>
            </div>
            <div class="match-info">
              <h1>{{ match.nombre || 'Partido Amistoso' }}</h1>
              <div class="match-meta">
                <span class="badge" :class="getStatusClass(match.estado)">
                  {{ match.estado }}
                </span>
                <span class="meta-item">📍 {{ match.ubicacion }}</span>
                <span class="meta-item">🕐 {{ formatTime(match.fecha) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="match-content">
          <div class="content-main">
            <div class="card">
              <h2>Detalles del Partido</h2>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Organizador</span>
                  <span class="detail-value">{{ match.owner_name || 'No especificado' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Jugadores</span>
                  <span class="detail-value">
                    {{ match.jugadores_confirmados || 0 }} / {{ match.max_jugadores || '∞' }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Costo</span>
                  <span class="detail-value">${{ match.costo || 0 }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Estado</span>
                  <span class="detail-value">{{ match.estado }}</span>
                </div>
              </div>

              <div v-if="match.descripcion" class="match-description">
                <h3>Descripción</h3>
                <p>{{ match.descripcion }}</p>
              </div>
            </div>

            <div class="card">
              <h2>Jugadores Confirmados</h2>
              <div v-if="loadingPlayers" class="loading-state">
                <div class="spinner"></div>
              </div>
              <div v-else-if="players.length === 0" class="empty-state">
                <p>Aún no hay jugadores confirmados</p>
              </div>
              <div v-else class="players-list">
                <div v-for="player in players" :key="player.jugador_id" class="player-item">
                  <div class="player-avatar">
                    {{ getInitials(player.nombre) }}
                  </div>
                  <div class="player-info">
                    <span class="player-name">{{ player.nombre }}</span>
                    <span class="player-status badge badge-success">Confirmado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="content-sidebar">
            <div class="card">
              <h3>Detalle</h3>
              <div class="actions-list">
                <button 
                  v-if="!hasConfirmed" 
                  @click="confirmAttendance" 
                  class="btn btn-success btn-block"
                  :disabled="confirmingAttendance"
                >
                  ✅ Confirmar Asistencia
                </button>
                <button 
                  v-else 
                  @click="cancelAttendance" 
                  class="btn btn-danger btn-block"
                  :disabled="confirmingAttendance"
                >
                  ❌ Cancelar Asistencia
                </button>
              </div>
            </div>

            <div class="card" v-if="match.latitud && match.longitud">
              <h3>Ubicación</h3>
              <div class="location-info">
                <p>📍 {{ match.ubicacion }}</p>
                <a 
                  :href="`https://www.google.com/maps?q=${match.latitud},${match.longitud}`" 
                  target="_blank"
                  class="btn btn-outline btn-block"
                >
                  Ver en Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { matchesAPI } from '../api';

const route = useRoute();
const authStore = useAuthStore();

const match = ref(null);
const players = ref([]);
const loading = ref(true);
const loadingPlayers = ref(true);
const confirmingAttendance = ref(false);
const hasConfirmed = ref(false);

const matchId = computed(() => route.params.id);
const userId = computed(() => authStore.user.value?.id);

onMounted(async () => {
  await loadMatchDetails();
  await loadPlayers();
});

const loadMatchDetails = async () => {
  try {
    const response = await matchesAPI.getDetails(matchId.value);
    match.value = response.data;
  } catch (error) {
    console.error('Error loading match details:', error);
  } finally {
    loading.value = false;
  }
};

const loadPlayers = async () => {
  try {
    const response = await matchesAPI.getAttendance(matchId.value);
    players.value = response.data.asistentes || [];
    hasConfirmed.value = players.value.some(p => p.jugador_id === userId.value);
  } catch (error) {
    console.error('Error loading players:', error);
  } finally {
    loadingPlayers.value = false;
  }
};

const confirmAttendance = async () => {
  confirmingAttendance.value = true;
  try {
    await matchesAPI.confirmAttendance({
      partido_id: matchId.value,
      jugador_id: userId.value,
    });
    hasConfirmed.value = true;
    await loadPlayers();
  } catch (error) {
    console.error('Error confirming attendance:', error);
  } finally {
    confirmingAttendance.value = false;
  }
};

const cancelAttendance = async () => {
  confirmingAttendance.value = true;
  try {
    await matchesAPI.deleteAttendance(matchId.value, userId.value);
    hasConfirmed.value = false;
    await loadPlayers();
  } catch (error) {
    console.error('Error canceling attendance:', error);
  } finally {
    confirmingAttendance.value = false;
  }
};

const formatDay = (date) => new Date(date).getDate();
const formatMonth = (date) => {
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return months[new Date(date).getMonth()];
};
const formatYear = (date) => new Date(date).getFullYear();
const formatTime = (date) => new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

const getStatusClass = (status) => {
  if (status === 'confirmado') return 'badge-success';
  if (status === 'cancelado') return 'badge-danger';
  return 'badge-warning';
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
</script>

<style scoped>
.match-detail-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--spacing-md);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  transition: all var(--transition-base);
}

.back-button:hover {
  color: var(--primary-light);
  transform: translateX(-4px);
}

.match-hero {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.match-hero-content {
  display: flex;
  gap: var(--spacing-2xl);
  align-items: center;
}

.match-date-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: var(--spacing-xl);
  background: var(--primary-gradient);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-glow);
}

.match-date-large .day {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.match-date-large .month {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.match-date-large .year {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.match-info h1 {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
}

.match-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
}

.meta-item {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.match-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-xl);
}

.content-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
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
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.match-description {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.match-description h3 {
  margin-bottom: var(--spacing-md);
  font-size: 1.125rem;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.player-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}

.player-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.btn-block {
  width: 100%;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

@media (max-width: 1024px) {
  .match-content {
    grid-template-columns: 1fr;
  }

  .content-sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .match-hero-content {
    flex-direction: column;
    text-align: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
