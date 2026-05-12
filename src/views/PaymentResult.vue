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
import { paymentAPI, membershipAPI } from '../api';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

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
  const token = route.query.token_ws || route.query.token; 
  const clubId = route.query.clubId;
  const statusParam = route.query.status;
  
  // 2. Caso de Aborto (Usuario anula en formulario Webpay)
  const tbkToken = route.query.TBK_TOKEN; 
  
  // 3. Caso de Timeout (TBK_ID_SESION sin token)
  const tbkIdSesion = route.query.TBK_ID_SESION;

  console.log('Payment Return Params:', route);

  // Normalización agresiva de parámetros
  const rawToken = route.query.token_ws || route.query.token || '';
  const tokenStr = Array.isArray(rawToken) ? rawToken[0] : String(rawToken);
  // Manejar 'no-token', 'null', 'undefined' como inválidos
  const cleanToken = (tokenStr === 'no-token' || tokenStr === 'null' || tokenStr === 'undefined') ? '' : tokenStr.trim();
  


  console.log('DEBUG PAYMENT VALIDATION:', { 
      rawToken, 
      cleanToken, 
      statusParam, 
      query: route.query 
  });

  // 1. Verificación inmediata de errores explícitos
  if (statusParam === 'error') {
      console.warn('Estado de error detectado en URL. Abortando verificación.');
      status.value = 'error';
      errorMessage.value = 'El pago no pudo ser procesado o fue cancelado.';
      return;
  }

  // 2. Verificación de token inválido
  if (!cleanToken) {
    console.warn('Token inválido, vacío o "no-token". Abortando verificación.');
    if (tbkToken) {
        status.value = 'error';
        errorMessage.value = 'La transacción fue anulada por el usuario.';
    } else if (tbkIdSesion) {
        status.value = 'error';
        errorMessage.value = 'La sesión de pago ha expirado o fue cancelada.';
    } else {
        status.value = 'error';
        errorMessage.value = 'Información de pago no válida o incompleta.';
    }
    return;
  }

  // 3. Si pasamos las validaciones, procedemos con el token limpio
  if (cleanToken) {
    if (!clubId) {
        status.value = 'error';
        errorMessage.value = 'Error de configuración: Falta el ID del club en el retorno del pago.';
        return;
    }

    try {
      // Asegurar que tenemos el usuario cargado para la activación
      if (!authStore.user) {
          await authStore.fetchUserProfile();
      }

      // 1. Verificar el estado usando el endpoint de suscripción en lugar del endpoint de retorno directo
      // Esto evita el problema de redirección (302) del endpoint /pagos/webpay-plus/return
      // y nos permite obtener el estado real de la transacción que ya debió ser confirmada
      // por el flujo automático de Transbank o por una llamada previa.
      
      console.log('Verificando estado de transacción (bypass redirect)...');
      
      // Usamos getTransactionStatus que llama a /suscripcion/activar
      // Este endpoint está diseñado para devolver JSON y activar la suscripción si es válido
      const response = await paymentAPI.getTransactionStatus(clubId, cleanToken);
      
      console.log('--- RAW TRANSBANK RESPONSE ---');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('------------------------------');

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
        
        // Extraer detalles de la transacción de forma robusta
        // Puede venir directo en root o dentro de 'transaction' / 'transaccion'
        const txData = response.data.transaction || response.data.transaccion || response.data;
        details.value = txData;

        // --- Lógica de Activación Post-Pago (Frontend Only Fix) ---
        // Recuperar el ciclo de facturación real seleccionado (ej. semestral)
        // ya que al backend se envió 'mensual' para evitar error de Enum.
        const pendingCycle = localStorage.getItem('pendingBillingCycle');
        
        // Obtener ID de usuario de forma robusta
        let userId = authStore.user?.id || authStore.user?.sub || authStore.user?.username;
        if (!userId) {
             try {
                 const storedUser = JSON.parse(localStorage.getItem('user'));
                 if (storedUser) userId = storedUser.id || storedUser.sub || storedUser.username;
             } catch (e) {}
        }

        if (pendingCycle && userId) {
            console.log(`Procesando activación para ciclo pendiente: ${pendingCycle}`);
            
            const now = new Date();
            const fechaFin = new Date(now);
            let monthsToAdd = 1;

            if (pendingCycle === 'semestral') monthsToAdd = 6;
            else if (pendingCycle === 'anual') monthsToAdd = 12;
            
            fechaFin.setMonth(fechaFin.getMonth() + monthsToAdd);

            try {
                const activationResponse = await membershipAPI.activarSuscripcion(clubId, {
                    fecha_fin: fechaFin.toISOString(),
                    motivo: `Activación automática Webpay (${pendingCycle})`,
                    user_id: userId
                });
                console.log('Suscripción activada con fecha correcta:', activationResponse);
                // Actualizar detalles con la respuesta de activación si es necesario
                if (activationResponse.data && activationResponse.data.suscripcion) {
                     details.value = { ...details.value, ...activationResponse.data.suscripcion };
                }
            } catch (actError) {
                console.error('Error activando suscripción con fecha personalizada:', actError);
                // Si falla la activación manual, mostrar advertencia pero mantener éxito del pago
                errorMessage.value = 'Pago exitoso, pero hubo un error al activar la suscripción. Por favor contacta a soporte.';
                // No cambiamos status a error para no asustar al usuario sobre su dinero, pero avisamos.
            } finally {
                localStorage.removeItem('pendingBillingCycle');
            }
        } else {
             console.warn('No se pudo activar suscripción: Falta pendingCycle o userId', { pendingCycle, userId });
        }
        // -----------------------------------------------------------

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