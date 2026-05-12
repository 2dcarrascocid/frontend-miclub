<template>
  <div class="container membership-view">
    <div class="header-section text-center">
      <h1>Membresía del Club</h1>
      <p>Elige el plan y periodo que mejor se adapte a tu club</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading || isRedirecting" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div v-else class="content-wrapper fade-in">
      
      <!-- Current Subscription -->
      <section class="card mb-4" v-if="suscripcion">
        <div class="card-header">
           <h2 class="card-title">Mi Suscripción Actual</h2>
        </div>s
        <div class="card-body">
            <div class="subscription-grid">
                <div class="sub-item">
                    <label>Plan</label>
                    <div class="sub-value highlight">{{ suscripcion.plan.nombre }}</div>
                </div>
                <div class="sub-item">
                    <label>Periodo</label>
                    <div class="sub-value capitalize">{{ suscripcion.billing_period || 'Mensual' }}</div>
                </div>
                <div class="sub-item">
                    <label>Valor Anual</label>
                    <div class="sub-value capitalize"> $ {{ formatPrice(suscripcion.plan.precio_anual) || 0}}</div>
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
            
            <div v-if="suscripcion.estado === 'pendiente_pago'" class="alert alert-warning mt-3">
                <p>⚠️ Tienes una solicitud de cambio pendiente. Realiza el pago para activar tu nuevo plan.</p>
                <button @click="handlePayment" class="btn btn-primary mt-2">Pagar Ahora</button>
            </div>
        </div>
        
        <div class="card-footer" v-if="suscripcion.estado === 'activa'">
             <button @click="confirmCancel" class="btn btn-danger btn-outline">
                 Cancelar Suscripción
             </button>
        </div>
      </section>

      <!-- Billing Cycle Selector -->
      <div class="billing-selector mb-4">
          <div class="cycle-tabs">
              <button 
                  v-for="(cycle, key) in cycles" 
                  :key="key"
                  @click="billingCycle = key"
                  :class="['cycle-tab', { active: billingCycle === key }]"
              >
                  {{ cycle.label }}
                  <span v-if="cycle.discount > 0" class="badge-discount">-{{ cycle.discount * 100 }}%</span>
              </button>
          </div>
      </div>

      <!-- Plans -->
      <section class="plans-section mb-4">
        <div class="plans-grid">
            <div v-for="plan in processedPlanes" :key="plan.id" class="card plan-card" :class="{ 'active-plan': isCurrentPlan(plan), 'recommended': billingCycle === 'anual' && plan.tier !== 'free' }">
                <div v-if="billingCycle === 'anual' && plan.tier !== 'free'" class="badge-recommended">Recomendado</div>
                
                <div class="plan-header">
                    <h3>{{ plan.nombre }}</h3>
                    <p>{{ plan.descripcion }}</p>
                </div>
                
                <div class="plan-price">
                    <div class="price-container">
                        <span class="currency">$</span>
                        <span class="amount">{{ formatPrice(plan.displayPrice) }}</span>
                        <span class="period-suffix" style="font-size: 1rem; color: var(--text-muted); margin-left: 4px; align-self: center;">/ mes</span>
                    </div>
                    <div class="period-label">
                        Facturado {{ billingCycle !== 'mensual' ? '$' + formatPrice(plan.totalPrice) : '' }} cada {{ cycles[billingCycle].months }} {{ cycles[billingCycle].months > 1 ? 'meses' : 'mes' }}
                    </div>
                    
                    <div v-if="plan.savings > 0" class="savings-text">
                        Ahorras ${{ formatPrice(plan.savings) }} {{ billingCycle === 'anual' ? 'al año' : 'por periodo' }}
                    </div>
                </div>

                <ul class="plan-features">
                    <li v-for="(val, key) in formatLimits(plan.limites)" :key="key">
                        <component :is="getFeatureIcon(key)" class="icon-check" />
                        <span>{{ formatFeatureLabel(key, val) }}</span>
                    </li>
                </ul>

                <div class="plan-footer">
                    <button 
                        @click="selectPlan(plan)" 
                        class="btn btn-block"
                        :class="isCurrentPlan(plan) ? 'btn-secondary' : 'btn-primary'"
                        :disabled="isCurrentPlan(plan) && billingCycle === suscripcion?.billing_period"
                    >
                        {{ getButtonLabel(plan) }}
                    </button>
                </div>
            </div>
        </div>
      </section>
       
       <!-- History -->
       <section class="card" v-if="historial.length > 0">
         <div class="card-header">
             <h2 class="card-title">Historial de Cambios</h2>
         </div>
         <div class="card-body">
             <table class="table">
                 <thead>
                     <tr>
                         <th>Fecha</th>
                         <th>Plan</th>
                         <th>Periodo</th>
                         <th>Estado</th>
                         <th>Monto</th>
                     </tr>
                 </thead>
                 <tbody>
                    <tr v-for="h in historial" :key="h.id">
                        <td>{{ formatDate(h.created_at) }}</td>
                        <td>{{ h.plan_nuevo?.nombre || '-' }}</td>
                        <td class="capitalize">{{ h.billing_period || 'Mensual' }}</td>
                        <td>
                            <span :class="['badge', statusBadgeClass(h.estado_nuevo)]">
                                {{ formatStatus(h.estado_nuevo) }}
                            </span>
                        </td>
                        <td>{{ h.monto ? '$' + formatPrice(h.monto) : '-' }}</td>
                    </tr>
                 </tbody>
             </table>
         </div>
       </section>
    </div>

    <!-- Modal Change Plan -->
    <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Confirmar Cambio de Plan</h3>

                <button @click="showModal = false" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p>Estás a punto de cambiar al plan <strong>{{ selectedPlan?.nombre }}</strong> con facturación <strong>{{ billingCycle }}</strong>.</p>
                
                <div class="summary-box">
                    <div class="summary-row">
                        <span>Plan:</span>
                        <span>{{ selectedPlan?.nombre }}</span>
                    </div>
                    <div class="summary-row">
                        <span>Periodo:</span>
                        <span class="capitalize">{{ billingCycle }}</span>
                    </div>
                    <div class="divider"></div>
                    <div class="summary-row total-row">
                        <span>Total a pagar:</span>
                        <span>${{ formatPrice(calculateTotal()) }}</span>
                    </div>
                </div>

                <div class="alert alert-info" v-if="suscripcion?.estado === 'activa'">
                    <small>Tu suscripción actual se cancelará y se iniciará una nueva. La vigencia restante no se pierde (se ajustará la fecha).</small>
                </div>
            </div>
            <div class="modal-footer">
                <button @click="showModal = false" class="btn btn-text">Cancelar</button>
                <button @click="confirmChangePlan" class="btn btn-primary" :disabled="isRedirecting">
                    {{ isRedirecting ? 'Procesando...' : 'Ir a Pagar' }}
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useClubStore } from '../stores/club';
import { membershipAPI, paymentAPI } from '../api';
import { Check, Star, Users, Layout, Shield } from 'lucide-vue-next';

const authStore = useAuthStore();
const clubStore = useClubStore();

const clubId = computed(() => {
    if (clubStore.selectedClub.value?.id) return clubStore.selectedClub.value.id;
    if (authStore.userClubs.value?.length > 0) return authStore.userClubs.value[0].id;
    return null;
});

const loading = ref(true);
const isRedirecting = ref(false);
const suscripcion = ref(null);
const planes = ref([]);
const historial = ref([]);
const billingCycle = ref('mensual'); // mensual | anual
const showModal = ref(false);
const selectedPlan = ref(null);

const cycles = {
    mensual: { label: 'Mensual', discount: 0, months: 1 },
    semestral: { label: 'Semestral', discount: 0.05, months: 6 },
    anual: { label: 'Anual', discount: 0.2, months: 12 } // 20% discount
};

// ... helpers ...
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL').format(price);
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-CL');
};

const formatStatus = (status) => {
    const map = {
        activa: 'Activa',
        pendiente_pago: 'Pendiente de Pago',
        cancelada: 'Cancelada',
        vencida: 'Vencida'
    };
    return map[status] || status;
};

const statusBadgeClass = (status) => {
    const map = {
        activa: 'badge-success',
        pendiente_pago: 'badge-warning',
        cancelada: 'badge-danger',
        vencida: 'badge-secondary'
    };
    return map[status] || 'badge-secondary';
};

const getFeatureIcon = (key) => {
    // Map keys to icons
    return Check; 
};

const formatLimits = (limites) => {
    if (!limites) return {};
    return limites;
};

const formatFeatureLabel = (key, val) => {
    const labels = {
        max_socios: 'Socios',
        max_almacenamiento_gb: 'GB Almacenamiento',
        soporte_prioritario: 'Soporte Prioritario',
        personalizacion: 'Personalización'
    };
    if (key === 'max_socios' && val > 100000) return 'Socios Ilimitados';
    return `${val} ${labels[key] || key}`;
};

const calculatePlanTotal = (plan, cycleKey) => {
    if (!plan) return 0;
    const cycle = cycles[cycleKey] || cycles.mensual;
    const monthly = Number(plan.precio_mensual);
    // Formula: Monthly * Months * (1 - Discount)
    return Math.round(monthly * cycle.months * (1 - cycle.discount));
};

// Computed Plans with Prices
const processedPlanes = computed(() => {
    return planes.value.map(plan => {
        const monthly = Number(plan.precio_mensual);
        const cycle = cycles[billingCycle.value] || cycles.mensual;
        
        const totalPrice = calculatePlanTotal(plan, billingCycle.value);
        const displayPrice = Math.round(totalPrice / cycle.months);
        const savings = (monthly * cycle.months) - totalPrice;

        return {
            ...plan,
            displayPrice,
            totalPrice,
            savings: Math.round(savings)
        };
    }).sort((a, b) => a.precio_mensual - b.precio_mensual);
});

const isCurrentPlan = (plan) => {
    return suscripcion.value?.plan?.id === plan.id;
};

const getButtonLabel = (plan) => {
    if (isCurrentPlan(plan)) {
        return billingCycle.value === suscripcion.value?.billing_period ? 'Plan Actual' : 'Cambiar Ciclo';
    }
    return 'Seleccionar';
};

// Actions
const loadData = async () => {
    loading.value = true;
    try {
        const promises = [membershipAPI.getPlanes()];
        
        if (clubId.value) {
            promises.push(membershipAPI.getSuscripcion(clubId.value));
            promises.push(membershipAPI.getHistorial(clubId.value));
        }

        const results = await Promise.allSettled(promises);

        if (results[0].status === 'fulfilled') planes.value = results[0].value.data;
        
        if (clubId.value) {
            if (results[1]?.status === 'fulfilled') suscripcion.value = results[1].value.data;
            if (results[2]?.status === 'fulfilled') historial.value = results[2].value.data || [];
        }
        
        // Init billing cycle from subscription
        if (suscripcion.value?.billing_period) {
            // Check if user changed it in session? No, let's sync with current.
            // But we might want to show defaults.
             // If we want to persist user selection we can use localStorage
             // but here we just default to current sub cycle or mensual
             const backendBillingPeriod = suscripcion.value.billing_period === 'semestral' ? 'mensual' : suscripcion.value.billing_period;
             billingCycle.value = backendBillingPeriod || 'mensual';
        }

    } catch (error) {
        console.error('Error loading membership data:', error);
    } finally {
        loading.value = false;
    }
};

const selectPlan = (plan) => {
    selectedPlan.value = plan;
    showModal.value = true;
};

const calculateTotal = () => {
    return calculatePlanTotal(selectedPlan.value, billingCycle.value);
};

const confirmChangePlan = () => {
    // If it's the same plan and cycle, do nothing
    if (isCurrentPlan(selectedPlan.value) && billingCycle.value === suscripcion.value?.billing_period) {
        showModal.value = false;
        return;
    }
    
    // Save pending cycle choice
    localStorage.setItem('pendingBillingCycle', billingCycle.value);

    // If changing plan, we initiate payment
    initiatePayment();
};

const handlePayment = () => {
    // Retry payment for pending subscription
    if (suscripcion.value.plan) {
        // Update cycle first to ensure processedPlanes has correct calculations
        billingCycle.value = suscripcion.value.billing_period || 'mensual';
        
        // Try to find the plan in processedPlanes to get the one with computed totalPrice
        const enrichedPlan = processedPlanes.value.find(p => p.id === suscripcion.value.plan.id);
        
        selectedPlan.value = enrichedPlan || suscripcion.value.plan;
        initiatePayment();
    }
};

const initiatePayment = async () => {
    // Determine the plan to pay for
    const planToPay = selectedPlan.value || suscripcion.value?.plan;
    
    if (!planToPay) {
        alert('Error: No se ha seleccionado un plan para el pago.');
        return;
    }

    // Determine period and calculation
    // Use the current selected billing cycle
    const currentCycleKey = billingCycle.value || 'mensual';
    
    // Use totalPrice from the plan object as requested
    // Fallback to calculation only if attribute is missing (safety net)
    const finalBilledAmount = planToPay.totalPrice !== undefined 
        ? planToPay.totalPrice 
        : calculatePlanTotal(planToPay, currentCycleKey);
    
    console.log(`Iniciando pago: Ciclo=${currentCycleKey}, Total=${finalBilledAmount}`);
    // Get User ID
    let userId = authStore.user?.id || authStore.user?.sub || authStore.user?.username;
    if (!userId) {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            if (storedUser) userId = storedUser.id || storedUser.sub || storedUser.username;
        } catch (e) {}
    }

    // Prepare Payment Data
    const paymentData = {
        club_id: clubId.value,
        plan_id: planToPay.id,
        plan_codigo: planToPay.codigo,
        user_id: userId,
        amount: finalBilledAmount, // El precio facturado
        billing_period: currentCycleKey,
        return_url: window.location.origin + '/payment/result?clubId=' + clubId.value
    };
    
    // Guardar ciclo de facturación pendiente para procesar en el retorno
    localStorage.setItem('pendingBillingCycle', currentCycleKey);

    if (!paymentData.plan_id || !paymentData.amount || !paymentData.plan_codigo || !paymentData.user_id) {
        console.error('Payment Data Error:', paymentData);
        alert(`Error: Datos incompletos (plan_codigo: ${paymentData.plan_codigo}, user_id: ${paymentData.user_id}).`);
        return;
    }

    try {
        isRedirecting.value = true;

        // Crear solicitud de cambio/suscripción antes del pago
        await membershipAPI.solicitarCambio(clubId.value, {
            plan_id: planToPay.id,
            plan_codigo: planToPay.codigo,
            billing_period: currentCycleKey,
            user_id: userId
        });

        const response = await paymentAPI.initiatePayment(clubId.value, paymentData);
        const { url, token } = response.data;
        
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
            alert('Error: Respuesta inválida del servidor.');
        }
    } catch (e) {
        isRedirecting.value = false;
        console.error(e);
        alert(`Error al conectar con pago: ${e.response?.data?.message || e.message}`);
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

.capitalize { text-transform: capitalize; }
.text-success { color: var(--accent-green); }

.billing-selector {
    display: flex;
    justify-content: center;
    margin-bottom: var(--spacing-2xl);
}

.cycle-tabs {
    display: inline-flex;
    background: var(--bg-secondary);
    padding: 4px;
    border-radius: var(--radius-full);
    border: 1px solid var(--border-color);
}

.cycle-tab {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.cycle-tab.active {
    background: var(--primary-gradient);
    color: white;
    box-shadow: var(--shadow-md);
}

.badge-discount {
    background: var(--accent-orange);
    color: white;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 10px;
}

/* Plan Card Enhancements */
.plans-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: var(--spacing-lg);
    overflow-x: auto;
    padding-bottom: var(--spacing-md); /* Space for scrollbar */
    align-items: stretch;
}

.plan-card {
    transition: transform 0.3s ease, border-color 0.3s ease;
    flex: 1;
    min-width: 300px; /* Ensure cards don't get too narrow */
    display: flex;
    flex-direction: column;
    margin: 10px;
}

.plan-features {
    flex-grow: 1; /* Push button to bottom */
}

.plan-card.recommended {
    border: 2px solid var(--accent-green);
    transform: scale(1.02);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
}

.badge-recommended {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent-green);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: var(--shadow-sm);
}

.price-container {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    line-height: 1;
}

.currency {
    font-size: 1.5rem;
    margin-top: 4px;
    margin-right: 2px;
    color: var(--text-muted);
}

.amount {
    font-size: 3rem;
    font-weight: 800;
    color: var(--text-primary);
}

.period-label {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-top: 4px;
}

.savings-text {
    text-align: center;
    color: var(--accent-green);
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 8px;
    background: rgba(16, 185, 129, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
}

.plan-price {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: var(--spacing-lg) 0;
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
}

.icon-check {
    width: 20px;
    height: 20px;
    min-width: 20px; /* Prevent shrinking */
    color: var(--accent-green);
    margin-right: var(--spacing-sm);
    flex-shrink: 0;
}

/* Modal Summary */
.summary-box {
    background: var(--bg-secondary);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
    font-size: 0.95rem;
}

.summary-row.highlight-row {
    background: rgba(16, 185, 129, 0.1);
    margin: 4px -8px;
    padding: 4px 8px;
    border-radius: 4px;
}

.summary-row.total-row {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--text-primary);
    margin-top: var(--spacing-sm);
}

.divider {
    height: 1px;
    background: var(--border-color);
    margin: var(--spacing-sm) 0;
}

/* Responsive */
@media (max-width: 768px) {
    .cycle-tabs {
        flex-direction: column;
        width: 100%;
    }
    
    .cycle-tab {
        justify-content: center;
        width: 100%;
    }
}

/* Subscription Card Styles */
.subscription-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.sub-item {
    display: flex;
    align-items: center;
    flex-wrap: wrap; 
}

.sub-item label {
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0;
    width: auto; /* Remove fixed width for compact layout */
    margin-right: var(--spacing-sm);
}

.sub-item label::after {
    content: ":";
    margin-left: 2px;
}

.sub-value {
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
}
</style>