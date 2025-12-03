<template>
  <div class="dashboard">
    <div class="container">
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1 class="fade-in">¡Hola, {{ userName }}! 👋</h1>
          <p class="slide-in-right">Bienvenido a tu panel de control</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" v-for="(stat, index) in stats" :key="index" 
             :style="{ animationDelay: `${index * 0.1}s` }">
          <div class="stat-icon" :style="{ background: stat.gradient }">
            {{ stat.icon }}
          </div>
          <div class="stat-content">
            <h3 class="stat-value">{{ stat.value }}</h3>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Próximos Partidos -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>⚽ Próximos Partidos</h2>
            <router-link to="/matches" class="btn btn-outline btn-sm">Ver Todos</router-link>
          </div>
          
          <div v-if="loadingMatches" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando partidos...</p>
          </div>

          <div v-else-if="upcomingMatches.length === 0" class="empty-state">
            <span class="empty-icon">📅</span>
            <p>No tienes partidos próximos</p>
            <router-link to="/matches/create" class="btn btn-primary btn-sm">Crear Partido</router-link>
          </div>

          <div v-else class="matches-list">
            <div v-for="match in upcomingMatches" :key="match.id" class="match-card">
              <div class="match-date">
                <span class="day">{{ formatDay(match.fecha) }}</span>
                <span class="month">{{ formatMonth(match.fecha) }}</span>
              </div>
              <div class="match-info">
                <h4>{{ match.nombre || 'Partido Amistoso' }}</h4>
                <p class="match-location">📍 {{ match.ubicacion || 'Por definir' }}</p>
                <p class="match-time">🕐 {{ formatTime(match.fecha) }}</p>
              </div>
              <div class="match-actions">
                <router-link :to="`/matches/${match.id}`" class="btn btn-secondary btn-sm">
                  Ver Detalles
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="dashboard-section">
          <div class="section-header">
            <h2>📊 Actividad Reciente</h2>
          </div>

          <div class="activity-list">
            <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
              <div class="activity-icon" :class="activity.type">
                {{ activity.icon }}
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="section-title">Acciones Rápidas</h2>
        <div class="actions-grid">
          <router-link to="/matches/create" class="action-card">
            <span class="action-icon">➕</span>
            <h3>Crear Partido</h3>
            <p>Organiza un nuevo partido</p>
          </router-link>
          
          <router-link to="/players" class="action-card">
            <span class="action-icon">👥</span>
            <h3>Ver Jugadores</h3>
            <p>Gestiona tu equipo</p>
          </router-link>
          
          <router-link to="/clubs" class="action-card">
            <span class="action-icon">🏆</span>
            <h3>Mis Clubes</h3>
            <p>Administra tus clubes</p>
          </router-link>
          
          <router-link to="/profile" class="action-card">
            <span class="action-icon">⚙️</span>
            <h3>Configuración</h3>
            <p>Edita tu perfil</p>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { matchesAPI } from '../api';

const authStore = useAuthStore();

const userName = computed(() => authStore.user.value?.nombre?.split(' ')[0] || 'Usuario');

const stats = ref([
  { icon: '⚽', label: 'Partidos Jugados', value: '0', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { icon: '🏆', label: 'Victorias', value: '0', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { icon: '👥', label: 'Jugadores', value: '0', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { icon: '📊', label: 'Asistencia', value: '0%', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
]);

const upcomingMatches = ref([]);
const loadingMatches = ref(true);

const recentActivity = ref([
  { id: 1, icon: '⚽', type: 'match', text: 'Bienvenido a Fair Play Chile', time: 'Ahora' },
  { id: 2, icon: '👤', type: 'profile', text: 'Perfil creado exitosamente', time: 'Hace 1 min' },
]);

onMounted(async () => {
  await loadUpcomingMatches();
});

const loadUpcomingMatches = async () => {
  try {
    const response = await matchesAPI.getPending({ 
      owner_id: authStore.user.value?.id,
      limit: 5 
    });
    upcomingMatches.value = response.data.partidos || [];
  } catch (error) {
    console.error('Error loading matches:', error);
  } finally {
    loadingMatches.value = false;
  }
};

const formatDay = (date) => {
  return new Date(date).getDate();
};

const formatMonth = (date) => {
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return months[new Date(date).getMonth()];
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--bg-primary);
}

.dashboard-header {
  margin-bottom: var(--spacing-2xl);
}

.welcome-section h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-section p {
  color: var(--text-muted);
  font-size: 1.125rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  transition: all var(--transition-base);
  animation: fadeIn 0.5s ease-out backwards;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  box-shadow: var(--shadow-md);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.dashboard-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.section-header h2 {
  font-size: 1.25rem;
  margin: 0;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
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
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.match-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.match-card:hover {
  background: var(--bg-hover);
  border-color: var(--primary-light);
  transform: translateX(4px);
}

.match-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: var(--primary-gradient);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.match-date .day {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.match-date .month {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

.match-info {
  flex: 1;
}

.match-info h4 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-primary);
}

.match-location,
.match-time {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.activity-item:hover {
  background: var(--bg-hover);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.activity-icon.match {
  background: rgba(102, 126, 234, 0.2);
}

.activity-icon.profile {
  background: rgba(16, 185, 129, 0.2);
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.quick-actions {
  margin-top: var(--spacing-2xl);
}

.section-title {
  margin-bottom: var(--spacing-lg);
  font-size: 1.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  text-decoration: none;
  transition: all var(--transition-base);
}

.action-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-light);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.action-card h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: 1.125rem;
}

.action-card p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome-section h1 {
    font-size: 2rem;
  }
}
</style>
