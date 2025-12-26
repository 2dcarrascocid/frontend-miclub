import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

// Lazy loading de componentes
const Login = () => import('../views/Login.vue');
const Register = () => import('../views/Register.vue');
const Dashboard = () => import('../views/Dashboard.vue');
const Players = () => import('../views/Players.vue');
const Clubs = () => import('../views/Clubs.vue');
const Profile = () => import('../views/Profile.vue');
const Finance = () => import('../views/Finance.vue');
const ErrorView = () => import('../views/ErrorView.vue');

const routes = [
    {
        path: '/',
        redirect: '/dashboard',
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
        // Ruta requiere autenticación pero el usuario no está autenticado
        next('/login');
    } else if (hideForAuth && authStore.isAuthenticated.value) {
        // Ruta es solo para no autenticados pero el usuario está autenticado
        next('/dashboard');
    } else {
        next();
    }
});

export default router;
