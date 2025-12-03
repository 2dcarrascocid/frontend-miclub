import { reactive, computed } from 'vue';
import { authAPI } from '../api';

const state = reactive({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    sessionId: localStorage.getItem('sessionId') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    loading: false,
    error: null,
});

export const useAuthStore = () => {
    const login = async (credentials) => {
        state.loading = true;
        state.error = null;

        try {
            const response = await authAPI.login(credentials);
            const { user, accessToken, refreshToken, sessionId } = response.data;

            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('sessionId', sessionId);

            // Actualizar estado
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.sessionId = sessionId;
            state.isAuthenticated = true;

            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al iniciar sesión';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const register = async (userData) => {
        state.loading = true;
        state.error = null;

        try {
            const response = await authAPI.register(userData);
            const { user, accessToken, refreshToken, sessionId } = response.data;

            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('sessionId', sessionId);

            // Actualizar estado
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.sessionId = sessionId;
            state.isAuthenticated = true;

            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al registrarse';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const logout = async () => {
        state.loading = true;

        try {
            if (state.sessionId) {
                await authAPI.logout(state.sessionId);
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('sessionId');

            // Limpiar estado
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionId = null;
            state.isAuthenticated = false;
            state.loading = false;
        }
    };

    const updateUser = (userData) => {
        state.user = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(state.user));
    };

    return {
        // State
        state,

        // Getters
        user: computed(() => state.user),
        isAuthenticated: computed(() => state.isAuthenticated),
        loading: computed(() => state.loading),
        error: computed(() => state.error),

        // Actions
        login,
        register,
        logout,
        updateUser,
    };
};
