<template>
  <div class="payment-result-container">
    <div class="result-card" :class="status">
      <div class="icon-wrapper">
        <span v-if="status === 'loading'" class="loader">⌛</span>
        <span v-else-if="status === 'success'" class="icon">✅</span>
        <span v-else class="icon">❌</span>
      </div>
      
      <h2 class="title">
        {{ title }}
      </h2>
      
      <p class="message">
        {{ message }}
      </p>
      
      <div v-if="details" class="details-box">
        <div class="detail-row">
          <span>Orden:</span>
          <strong>{{ details.buy_order }}</strong>
        </div>
        <div class="detail-row">
          <span>Monto:</span>
          <strong>{{ formatCurrency(details.amount) }}</strong>
        </div>
        <div class="detail-row">
          <span>Fecha:</span>
          <span>{{ formatDate(details.transaction_date) }}</span>
        </div>
         <div class="detail-row" v-if="details.authorization_code">
          <span>Código Auth:</span>
          <span>{{ details.authorization_code }}</span>
        </div>
        <div class="detail-row">
            <span>Tarjeta:</span>
            <span>**** **** **** {{ details.card_detail?.card_number || '****' }}</span>
        </div>
      </div>
      
      <div class="actions">
        <button v-if="status === 'success'" @click="goToDashboard" class="btn btn-primary">
          Ir al Dashboard
        </button>
        <button v-else @click="retryPayment" class="btn btn-secondary">
          Volver a intentar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { paymentAPI } from '../api';

const route = useRoute();
const router = useRouter();

const status = ref('loading'); // loading, success, error
const details = ref(null);
const errorMessage = ref('');

const title = computed(() => {
  if (status.value === 'loading') return 'Procesando pago...';
  if (status.value === 'success') return '¡Pago Exitoso!';
  return 'Pago No Completado';
});

const message = computed(() => {
  if (status.value === 'loading') return 'Estamos confirmando tu transacción con el banco. Por favor espera un momento.';
  if (status.value === 'success') return 'Tu suscripción ha sido activada correctamente.';
  return errorMessage.value || 'Hubo un problema al procesar tu pago. Por favor intenta nuevamente.';
});

const formatCurrency = (amount) => {
  if (!amount) return '$0';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('es-CL');
};

const goToDashboard = () => {
  router.push('/dashboard');
};

const retryPayment = () => {
    router.push('/membership');
};

onMounted(async () => {
  // 1. Caso de Éxito / Rechazo (Flujo normal)
  const token = route.query.token_ws; 
  const clubId = route.query.clubId;
  
  // 2. Caso de Aborto (Usuario anula en formulario Webpay)
  const tbkToken = route.query.TBK_TOKEN; 
  
  // 3. Caso de Timeout (TBK_ID_SESION sin token)
  const tbkIdSesion = route.query.TBK_ID_SESION;

  console.log('Payment Return Params:', route.query);

  if (token) {
    if (!clubId) {
        status.value = 'error';
        errorMessage.value = 'Error de configuración: Falta el ID del club en el retorno del pago.';
        return;
    }

    try {
      // Confirmar transacción con backend
      // El backend debe llamar a commit() en Transbank SDK
      const response = await paymentAPI.getTransactionStatus(clubId, token);
      console.log('Transaction Status:', response.data);
      
      const { status: txStatus, response_code } = response.data;

      // Convertir response_code a número para comparación segura
      const code = Number(response_code);
      
      // Verificar mensaje de éxito explícito como fallback
      const hasSuccessMessage = response.data.message && 
          (response.data.message.toLowerCase().includes('exitosamente') || 
           response.data.message.toLowerCase().includes('correctamente') ||
           response.data.message.toLowerCase().includes('éxito'));

      // Criterios de éxito robustos
      if ((txStatus === 'AUTHORIZED' && code === 0) || 
          response.data.status === 'active' || 
          response.data.estado === 'activa' ||
          hasSuccessMessage) {
          
        status.value = 'success';
        details.value = response.data;
      } else {
        status.value = 'error';
        errorMessage.value = response.data.message || 'El pago fue rechazado por el banco.';
        console.warn('Pago rechazado o estado inválido:', response.data);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      status.value = 'error';
      errorMessage.value = error.response?.data?.message || 'No se pudo verificar el estado del pago.';
    }
  } else if (tbkToken) {
    // Usuario canceló explícitamente
    status.value = 'error';
    errorMessage.value = 'La transacción fue anulada por el usuario.';
  } else if (tbkIdSesion && !token) {
    // Timeout o error de sesión
    status.value = 'error';
    errorMessage.value = 'La sesión de pago ha expirado o fue cancelada.';
  } else {
    // Acceso directo sin parámetros
    status.value = 'error';
    errorMessage.value = 'Información de pago no válida.';
  }
});
</script>

<style scoped>
.payment-result-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 1rem;
  background-color: var(--bg-primary);
}

.result-card {
  background: var(--bg-secondary);
  border-radius: 1rem;
  padding: 2.5rem;
  text-align: center;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.result-card.success {
    border-color: var(--accent-green);
}

.result-card.error {
    border-color: var(--accent-red);
}

.icon-wrapper {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.loader {
  display: inline-block;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.message {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.details-box {
  background: var(--bg-tertiary);
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.detail-row span:first-child {
    color: var(--text-muted);
}

.detail-row:last-child {
  margin-bottom: 0;
}

.actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.actions .btn {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
}
</style>