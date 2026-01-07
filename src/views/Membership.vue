<template>
  <div class="container membership-view">
    <div class="header-section">
      <h1>Membresía del Club</h1>
      <p>Gestiona tu plan y suscripción</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading || isRedirecting" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div v-else class="content-wrapper fade-in">
      
      <!-- Current Subscription -->
      <section class="card mb-4">
        <div class="card-header">
           <h2 class="card-title">Mi Suscripción Actual</h2>
        </div>
        <div class="card-body">
            <div v-if="suscripcion" class="subscription-grid">
                <div class="sub-item">
                    <label>Plan</label>
                    <div class="sub-value highlight">{{ suscripcion.plan.nombre }}</div>
                </div>
                <div class="sub-item">
                    <label>Estado</label>
                    <div>
                        <span :class="['badge', statusBadgeClass(suscripcion.estado)]">
                            {{ formatStatus(suscripcion.estado) }}
                        </span>
                    </div>
                </div>
                <div class="sub-item">
                    <label>Fecha Inicio</label>
                    <div class="sub-value">{{ formatDate(suscripcion.fecha_inicio) }}</div>
                </div>
                <div class="sub-item">
                    <label>Próxima Renovación</label>
                    <div class="sub-value">{{ formatDate(suscripcion.fecha_fin) || 'Indefinido' }}</div>
                </div>
            </div>
            
            <div v-if="suscripcion && suscripcion.estado === 'pendiente_pago'" class="alert alert-warning mt-3">
                <p>⚠️ Tienes una solicitud de cambio pendiente. Realiza el pago para activar tu nuevo plan.</p>
                <button @click="handlePayment" class="btn btn-primary mt-2">Pagar Ahora</button>
            </div>
            
            <div v-if="!suscripcion" class="text-muted">
                No tienes una suscripción activa. Estás en el plan gratuito por defecto.
            </div>
        </div>
        
        <div class="card-footer" v-if="suscripcion && suscripcion.estado === 'activa'">
             <button @click="confirmCancel" class="btn btn-danger btn-outline">
                 Cancelar Suscripción
             </button>
        </div>
      </section>

      <!-- Plans -->
      <section class="plans-section mb-4">
        <h2>Planes Disponibles</h2>
        <div class="plans-grid">
            <div v-for="plan in planes" :key="plan.id" class="card plan-card" :class="{ 'active-plan': isCurrentPlan(plan) }">
                <div class="plan-header">
                    <h3>{{ plan.nombre }}</h3>
                    <p>{{ plan.descripcion }}</p>
                </div>
                <div class="plan-price">
                    <span class="currency">$</span>
                    <span class="amount">{{ formatPrice(plan.precio_mensual) }}</span>
                    <span class="period">/mes</span>
                </div>
                <ul class="plan-features">
                    <li v-for="(val, key) in formatLimits(plan.limites)" :key="key">
                        <!-- Simple Check Icon SVG -->
                        <svg class="icon-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>{{ key }}:</strong> {{ val }}</span>
                    </li>
                </ul>
                <div class="plan-action">
                    <button v-if="!isCurrentPlan(plan)" 
                            @click="selectPlan(plan)" 
                            class="btn btn-primary w-full">
                        Seleccionar Plan
                    </button>
                    <button v-else disabled class="btn btn-secondary w-full">
                        Plan Actual
                    </button>
                </div>
            </div>
        </div>
      </section>
      
      <!-- History -->
      <section class="card">
        <div class="card-header">
            <h2 class="card-title">Historial de Cambios</h2>
        </div>
        <div class="card-body overflow-x">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Plan Nuevo</th>
                        <th>Estado</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="h in historial" :key="h.id">
                        <td>{{ formatDate(h.created_at) }}</td>
                        <td>{{ h.plan_nuevo?.nombre || '-' }}</td>
                        <td>
                            <span :class="['badge', statusBadgeClass(h.estado_nuevo)]">
                                {{ formatStatus(h.estado_nuevo) }}
                            </span>
                        </td>
                        <td class="text-muted small">{{ h.motivo }}</td>
                    </tr>
                    <tr v-if="historial.length === 0">
                        <td colspan="4" class="text-center text-muted">Sin historial registrado</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </section>

    </div>

    <!-- Modal Change Plan -->
    <div v-if="showModal" class="modal-overlay">
       <div class="card modal-card slide-in-right">
          <div class="card-header">
              <h3 class="card-title">Cambiar a {{ selectedPlan?.nombre }}</h3>
          </div>
          <div class="card-body">
             <p>
                Estás solicitando un cambio de plan. Se generará una orden de pago pendiente.
                ¿Deseas continuar?
             </p>
             <div class="mt-2 p-2 bg-secondary rounded border border-color">
                 <strong>Precio:</strong> ${{ formatPrice(selectedPlan?.precio_mensual) }} / mes
             </div>
          </div>
          <div class="card-footer">
             <button @click="showModal = false" class="btn btn-secondary">Cancelar</button>
             <button @click="confirmChange" class="btn btn-primary">Confirmar</button>
          </div>
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { membershipAPI, paymentAPI } from '../api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const loading = ref(true);
const planes = ref([]);
const suscripcion = ref(null);
const historial = ref([]);
const showModal = ref(false);
const selectedPlan = ref(null);
const isRedirecting = ref(false);

// Get Club ID
const clubId = computed(() => {
    return authStore.userClubs.value?.[0]?.id;
});

const loadData = async () => {
    loading.value = true;
    try {
        // Si no tenemos clubId, intentamos refrescar el perfil
        if (!clubId.value) {
            try {
                await authStore.fetchUserProfile();
            } catch (e) {
                console.warn("No se pudo obtener el perfil del usuario:", e);
            }
        }

        const promises = [membershipAPI.getPlanes()];
        
        if (clubId.value) {
             promises.push(membershipAPI.getSuscripcion(clubId.value));
             promises.push(membershipAPI.getHistorial(clubId.value));
        }

        const results = await Promise.allSettled(promises);
        
        // Planes (0)
        if (results[0].status === 'fulfilled') planes.value = results[0].value.data;
        
        if (clubId.value) {
            // Suscripción (1)
            if (results[1].status === 'fulfilled') {
                suscripcion.value = results[1].value.data;
            } else {
                if (results[1].reason?.response?.status !== 404) {
                    console.error("Error fetching subscription:", results[1].reason);
                }
            }

            // Historial (2)
            if (results[2].status === 'fulfilled') {
                historial.value = results[2].value.data;
            } else {
                 console.warn("Error fetching history or empty:", results[2].reason);
            }
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const formatPrice = (price) => {
    if (price === undefined || price === null) return '0';
    return new Intl.NumberFormat('es-CL').format(price);
};

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : '';

const formatStatus = (status) => {
    const map = { 'activa': 'Activa', 'pendiente_pago': 'Pendiente Pago', 'vencida': 'Vencida', 'cancelada': 'Cancelada' };
    return map[status] || status;
};

const statusBadgeClass = (status) => {
    const map = { 
        'activa': 'badge-success', 
        'pendiente_pago': 'badge-warning', 
        'vencida': 'badge-danger', 
        'cancelada': 'badge-secondary' 
    };
    return map[status] || 'badge-secondary';
};

const formatLimits = (limites) => {
    if (!limites) return {};
    return {
        'Max Jugadores': limites.max_jugadores ? limites.max_jugadores : 'Ilimitado',
        'Pagos Online': limites.permite_eventos_pago ? 'Sí' : 'No',
        'Reportes': limites.permite_reportes ? 'Sí' : 'No'
    };
};

const isCurrentPlan = (plan) => {
    if (suscripcion.value) {
        return suscripcion.value.plan_id === plan.id;
    }
    // Si no hay suscripción, el plan free es el actual
    return plan.tier === 'free';
};

const selectPlan = (plan) => {
    selectedPlan.value = plan;
    showModal.value = true;
};

const confirmChange = async () => {
    if (!selectedPlan.value) return;
    if (!clubId.value) {
        alert('Error: No se ha identificado el club asociado. Por favor recarga la página.');
        return;
    }
    try {
        await membershipAPI.solicitarCambio(clubId.value, {
            plan_codigo: selectedPlan.value.codigo,
            billing_period: 'mensual',
            user_id: authStore.user.id
        });
        showModal.value = false;
        await loadData();
        
        // Proceder automáticamente al pago si la suscripción quedó pendiente
        if (suscripcion.value?.estado === 'pendiente_pago') {
             console.log('Iniciando flujo de pago automático...');
             await handlePayment();
        } else {
             alert('Solicitud procesada correctamente.');
        }
    } catch (e) {
        console.error(e);
        alert('Error al solicitar cambio: ' + (e.response?.data?.message || e.message));
    }
};

const handlePayment = async () => {
    if (!clubId.value) {
         alert('Error: No se ha identificado el club asociado. Por favor recarga la página.');
         return;
    }

    console.log('--- DEBUG PAYMENT DATA ---');
            console.log('Suscripcion Full:', suscripcion.value);
            console.log('Plan en Suscripcion:', suscripcion.value?.plan);
            console.log('Auth User Full:', authStore.user);
            console.log('Club ID:', clubId.value);
            
            // Intento robusto de recuperación de datos faltantes
            let planCodigo = suscripcion.value?.plan?.codigo || suscripcion.value?.plan_codigo;
            
            // 1. Si falta, buscar en la lista de planes cargados
            if (!planCodigo && suscripcion.value?.plan_id) {
                const foundPlan = planes.value.find(p => p.id === suscripcion.value.plan_id);
                if (foundPlan) {
                    console.log('Plan encontrado en lista:', foundPlan);
                    planCodigo = foundPlan.codigo;
                }
            }
            
            // 2. Si falta, buscar en el plan seleccionado recientemente
            if (!planCodigo && selectedPlan.value) {
                 planCodigo = selectedPlan.value.codigo;
            }

            // Recuperación de User ID
            let userId = authStore.user?.id || authStore.user?.sub || authStore.user?.username;
            
            // 3. Fallback directo a localStorage si el store falla
            if (!userId) {
                try {
                    const storedUser = JSON.parse(localStorage.getItem('user'));
                    if (storedUser) {
                        userId = storedUser.id || storedUser.sub || storedUser.username;
                        console.log('User ID recuperado de localStorage:', userId);
                    }
                } catch (e) {
                    console.error('Error leyendo user de localStorage', e);
                }
            }

            console.log('Datos finales para pago - Plan:', planCodigo, 'User:', userId);

            const paymentData = {
                club_id: clubId.value,
                plan_id: suscripcion.value?.plan?.id || suscripcion.value?.plan_id,
                plan_codigo: planCodigo,
                user_id: userId,
                amount: Math.round(Number(suscripcion.value?.plan?.precio_mensual || 0)),
                return_url: window.location.origin + '/payment/result?clubId=' + clubId.value
            };

            if (!paymentData.plan_id || !paymentData.amount || !paymentData.plan_codigo || !paymentData.user_id) {
                console.error('Datos incompletos para el pago:', paymentData);
                alert('Error: Datos de suscripción incompletos. Faltan datos requeridos (plan_codigo, user_id).');
                return;
            }

            try {
                isRedirecting.value = true;
                const response = await paymentAPI.initiatePayment(clubId.value, paymentData);

        // Backend devuelve { token, url, buy_order }
        const { url, token, buy_order } = response.data;
        
        console.log(`Iniciando redirección a Webpay. Orden: ${buy_order}`);

        if (url && token) {
            const form = document.createElement('form');
            form.action = url;
            form.method = 'POST';
            
            const inputToken = document.createElement('input');
            inputToken.type = 'hidden';
            inputToken.name = 'token_ws';
            inputToken.value = token;
            
            form.appendChild(inputToken);
            document.body.appendChild(form);
            form.submit();
        } else {
            isRedirecting.value = false;
            console.error('Respuesta inválida del servidor:', response.data);
            alert('Error al iniciar pago: La respuesta del servidor no contiene la URL o el token necesarios.');
        }
    } catch (e) {
        isRedirecting.value = false;
        console.error('Error en el proceso de pago:', e);
        const errorMessage = e.response?.data?.message || e.message || 'Error desconocido';
        const errorDetail = JSON.stringify(e.response?.data || {});
        alert(`Error al conectar con la pasarela de pago: ${errorMessage}. Detalles: ${errorDetail}`);
    }
};

const confirmCancel = async () => {
    if(!confirm('¿Estás seguro de cancelar tu suscripción?')) return;
    try {
        await membershipAPI.cancelarSuscripcion(clubId.value, { user_id: authStore.user.id });
        await loadData();
    } catch (e) {
         console.error(e);
         alert('Error al cancelar');
    }
};

onMounted(() => {
    loadData();
});
</script>

<style scoped>
.membership-view {
    padding-top: var(--spacing-xl);
    padding-bottom: var(--spacing-2xl);
}

.header-section {
    margin-bottom: var(--spacing-xl);
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: var(--spacing-2xl);
}

/* Subscription Details */
.subscription-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
}

.sub-item label {
    display: block;
    color: var(--text-muted);
    font-size: 0.875rem;
    margin-bottom: var(--spacing-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
}

.sub-value {
    font-size: 1.1rem;
    color: var(--text-primary);
}

.sub-value.highlight {
    color: var(--accent-green);
    font-weight: 700;
    font-size: 1.25rem;
}

.alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid var(--accent-orange);
    color: var(--accent-orange);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
}

/* Plans Grid */
.plans-section h2 {
    margin-bottom: var(--spacing-lg);
}

.plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-xl);
}

.plan-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.plan-card.active-plan {
    border-color: var(--accent-green);
    box-shadow: 0 0 0 2px var(--accent-green), var(--shadow-lg);
}

.plan-header h3 {
    margin-bottom: var(--spacing-xs);
    color: var(--primary-light);
}

.plan-price {
    margin: var(--spacing-lg) 0;
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
}

.plan-price .currency {
    font-size: 1.5rem;
    vertical-align: top;
    margin-right: 2px;
}

.plan-price .amount {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1;
}

.plan-price .period {
    color: var(--text-muted);
    margin-left: 4px;
}

.plan-features {
    list-style: none;
    margin-bottom: var(--spacing-xl);
    flex-grow: 1;
}

.plan-features li {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-sm);
    color: var(--text-secondary);
    font-size: 0.95rem;
}

.icon-check {
    width: 20px;
    height: 20px;
    color: var(--accent-green);
    margin-right: var(--spacing-sm);
    flex-shrink: 0;
}

.w-full { width: 100%; }

/* Table */
.overflow-x {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    color: var(--text-secondary);
    min-width: 600px;
}

.data-table th {
    text-align: left;
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    font-weight: 600;
    background: rgba(0,0,0,0.2);
}

.data-table td {
    padding: var(--spacing-md);
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.small { font-size: 0.875rem; }

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-md);
}

.modal-card {
    max-width: 500px;
    width: 100%;
    background: var(--bg-card);
    animation: fadeIn 0.3s ease-out;
}

/* Responsive */
@media (max-width: 768px) {
    .plans-grid {
        grid-template-columns: 1fr;
    }
    
    .subscription-grid {
        grid-template-columns: 1fr;
    }
}
</style>
