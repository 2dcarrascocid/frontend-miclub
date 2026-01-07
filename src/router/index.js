import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Lazy loading de componentes
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Landing = () => import('../views/Landing.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const Players = () => import('../views/Players.vue');
const Clubs = () => import('../views/Clubs.vue');
const Profile = () => import('../views/Profile.vue');
const Finance = () => import('../views/Finance.vue');
const ErrorView = () => import('../views/ErrorView.vue');

const routes = [
    {
        path: '/',
        name: 'Landing',
        component: Landing,
        meta: { requiresAuth: false },
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false, hideForAuth: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: Register,
        meta: { requiresAuth: false, hideForAuth: true },
    },
    {
        path: '/verify-account',
        name: 'VerifyAccount',
        component: () => import('../views/VerifyAccount.vue'),
        meta: { requiresAuth: false, hideForAuth: true },
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true },
    },
    {
        path: '/players',
        name: 'Players',
        component: Players,
        meta: { requiresAuth: true },
    },
    {
        path: '/players/:id',
        name: 'PlayerDetail',
        component: () => import('../views/players/PlayerDetail.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/events',
        name: 'Events',
        component: () => import('../views/Events.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/events/:id',
        name: 'EventDetail',
        component: () => import('../views/EventDetail.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/clubs',
        name: 'Clubs',
        component: Clubs,
        meta: { requiresAuth: true },
    },
    {
        path: '/clubs/:id',
        name: 'ClubDetail',
        component: () => import('../views/ClubDetail.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/finance',
        name: 'Finance',
        component: Finance,
        meta: { requiresAuth: true },
    },
    {
        path: '/membership',
        name: 'Membership',
        component: () => import('../views/Membership.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/payment/result',
        name: 'PaymentResult',
        component: () => import('../views/PaymentResult.vue'),
        meta: { requiresAuth: true },
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true },
    },
    {
        path: '/error',
        name: 'Error',
        component: ErrorView,
        meta: { requiresAuth: false },
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: ErrorView,
        props: { statusCode: 404 },
        meta: { requiresAuth: false },
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const hideForAuth = to.matched.some(record => record.meta.hideForAuth);

    if (requiresAuth && !authStore.isAuthenticated.value) {
        // Ruta requiere autenticaci�n pero el usuario no est� autenticado
        next('/login');
    } else if (hideForAuth && authStore.isAuthenticated.value) {
        // Ruta es solo para no autenticados pero el usuario est� autenticado
        next('/dashboard');
    } else if (requiresAuth && authStore.isAuthenticated.value) {
        // Validar permisos din�micos
        const permissions = authStore.permissions.value || [];
        
        // Rutas que siempre estn permitidas si ests logueado
        const alwaysAllowed = ['/dashboard', '/profile', '/membership', '/payment/result', '/error'];
        
        // Comprobar si la ruta actual coincide con alguna permitida (o es subruta)
        const isAllowedExactOrSub = alwaysAllowed.some(path => to.path === path || to.path.startsWith(path + '/')) ||
                                    permissions.some(p => to.path === p.ruta || to.path.startsWith(p.ruta + '/'));
        
        if (isAllowedExactOrSub) {
            next();
        } else {
            console.warn(`Acceso denegado a ${to.path}. Redirigiendo a Dashboard.`);
            if (to.path !== '/dashboard') {
                next('/dashboard');
            } else {
                 next('/error');
            }
        }
    } else {
        next();
    }
});

export default router;
