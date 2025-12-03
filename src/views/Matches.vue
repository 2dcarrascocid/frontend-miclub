<template>
  <div class="matches-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>⚽ Mis Partidos</h1>
          <p>Gestiona y organiza tus partidos</p>
        </div>
        <router-link to="/matches/create" class="btn btn-primary">
          ➕ Crear Partido
        </router-link>
      </div>

      <div class="matches-tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending'"
        >
          📅 Próximos
          <span class="badge badge-primary" v-if="pendingMatches.length">{{ pendingMatches.length }}</span>
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'past' }"
          @click="activeTab = 'past'"
        >
          📊 Pasados
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'attending' }"
          @click="activeTab = 'attending'"
        >
          ✅ Asistiré
        </button>
      </div>

      <div class="matches-content">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando partidos...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="currentMatches.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <h3>No hay partidos {{ activeTabLabel }}</h3>
          <p>{{ emptyMessage }}</p>
          <router-link to="/matches/create" class="btn btn-primary">
            Crear Primer Partido
          </router-link>
        </div>

        <!-- Matches Grid -->
        <div v-else class="matches-grid">
          <div 
            v-for="match in currentMatches" 
            :key="match.id" 
            class="match-card"
            @click="goToMatch(match.id)"
          >
            <div class="match-header">
              <div class="match-date-badge">
                <span class="day">{{ formatDay(match.fecha) }}</span>
                <span class="month">{{ formatMonth(match.fecha) }}</span>
              </div>
              <div class="match-status">
                <span class="badge" :class="getStatusClass(match)">
                  {{ getStatusText(match) }}
                </span>
              </div>
            </div>

            <div class="match-body">
              <h3 class="match-title">{{ match.nombre || 'Partido Amistoso' }}</h3>
              
              <div class="match-details">
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span>{{ match.ubicacion || 'Por definir' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🕐</span>
                  <span>{{ formatDateTime(match.fecha) }}</span>
                </div>
                <div class="detail-item" v-if="match.jugadores_confirmados !== undefined">
                  <span class="detail-icon">👥</span>
                  <span>{{ match.jugadores_confirmados }} / {{ match.max_jugadores || '∞' }} jugadores</span>
                </div>
              </div>
            </div>

            <div class="match-footer">
              <button class="btn btn-secondary btn-sm" @click.stop="goToMatch(match.id)">
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { matchesAPI } from '../api';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('pending');
const loading = ref(false);

const pendingMatches = ref([]);
const pastMatches = ref([]);
const attendingMatches = ref([]);

const currentMatches = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return pendingMatches.value;
    case 'past':
      return pastMatches.value;
    case 'attending':
      return attendingMatches.value;
    default:
      return [];
  }
});

const activeTabLabel = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return 'próximos';
    case 'past':
      return 'pasados';
    case 'attending':
      return 'confirmados';
    default:
      return '';
  }
});

const emptyMessage = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return 'Crea tu primer partido y comienza a jugar';
    case 'past':
      return 'Aún no has jugado ningún partido';
    case 'attending':
      return 'No tienes partidos confirmados';
    default:
      return '';
  }
});

onMounted(() => {
  loadMatches();
});

watch(activeTab, () => {
  loadMatches();
});

const loadMatches = async () => {
  loading.value = true;
  try {
    const userId = authStore.user.value?.id;
    
    if (activeTab.value === 'pending') {
      const response = await matchesAPI.getPending({ owner_id: userId });
      pendingMatches.value = response.data.partidos || [];
    } else if (activeTab.value === 'past') {
      const response = await matchesAPI.getPast({ owner_id: userId });
      pastMatches.value = response.data.partidos || [];
    } else if (activeTab.value === 'attending') {
      const response = await matchesAPI.getMyAttendances({ jugador_id: userId });
      attendingMatches.value = response.data.partidos || [];
    }
  } catch (error) {
    console.error('Error loading matches:', error);
  } finally {
    loading.value = false;
  }
};

const goToMatch = (matchId) => {
  router.push(`/matches/${matchId}`);
};

const formatDay = (date) => {
  return new Date(date).getDate();
};

const formatMonth = (date) => {
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return months[new Date(date).getMonth()];
};

const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('es-CL', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const getStatusClass = (match) => {
  if (activeTab.value === 'past') return 'badge-secondary';
  if (match.estado === 'confirmado') return 'badge-success';
  return 'badge-warning';
};

const getStatusText = (match) => {
  if (activeTab.value === 'past') return 'Finalizado';
  if (match.estado === 'confirmado') return 'Confirmado';
  return 'Pendiente';
};
</script>

<style scoped>
.matches-page {
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

.matches-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  background: var(--bg-card);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-button.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-md);
}

.matches-content {
  min-height: 400px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  gap: var(--spacing-md);
  min-height: 400px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  color: var(--text-muted);
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.match-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: all var(--transition-base);
  animation: fadeIn 0.5s ease-out;
}

.match-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}

.match-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.match-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 70px;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.match-date-badge .day {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.match-date-badge .month {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  margin-top: 2px;
}

.match-body {
  margin-bottom: var(--spacing-lg);
}

.match-title {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.match-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-icon {
  font-size: 1rem;
}

.match-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .matches-tabs {
    flex-direction: column;
  }

  .tab-button {
    justify-content: flex-start;
  }

  .matches-grid {
    grid-template-columns: 1fr;
  }
}
</style>
