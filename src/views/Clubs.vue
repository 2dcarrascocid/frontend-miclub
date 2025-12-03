<template>
  <div class="clubs-page">
    <div class="container">
      <div class="page-header">
        <div>
          <h1>🏆 Mis Clubes</h1>
          <p>Administra tus clubes deportivos</p>
        </div>
      </div>

      <div class="clubs-content">
        <div class="empty-state">
          <span class="empty-icon">🏆</span>
          <h3>Gestión de Clubes</h3>
          <p>Esta funcionalidad estará disponible próximamente</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Placeholder para la vista de clubes
</script>

<style scoped>
.clubs-page {
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

.clubs-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
  gap: var(--spacing-md);
  min-height: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
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
</style>
