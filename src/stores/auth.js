import { reactive, computed, toRefs } from 'vue';
import { authAPI } from '../api';

const state = reactive({
    user: (() => {
        try {
            const stored = localStorage.getItem('user');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('user');
            return null;
        }
    })(),
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    sessionId: localStorage.getItem('sessionId') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
    userRoles: (() => {
        try {
            const stored = localStorage.getItem('userRoles');
            if (!stored || stored === 'undefined') return [];
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('userRoles');
            return [];
        }
    })(),
    userClubs: (() => {
        try {
            const stored = localStorage.getItem('userClubs');
            if (!stored || stored === 'undefined') return [];
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('userClubs');
            return [];
        }
    })(),
    permissions: (() => {
        try {
            const stored = localStorage.getItem('userPermissions');
            if (!stored || stored === 'undefined') return [];
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('userPermissions');
            return [];
        }
    })(),
    userPlan: (() => {
        try {
            const stored = localStorage.getItem('userPlan');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('userPlan');
            return null;
        }
    })(),
    loading: false,
    error: null,
});

export const useAuthStore = () => {
    const login = async (credentials) => {
        state.loading = true;
        state.error = null;

        try {
            const response = await authAPI.login(credentials);

            const { usuario, tokens, clubes, roles, permisos, plan } = response.data;
            const user = usuario;
            const accessToken = tokens.access_token;
            const refreshToken = tokens.refresh_token;
            const sessionId = tokens.session_id;

            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('sessionId', sessionId);
            if (clubes && clubes.length > 0) {
                localStorage.setItem('userClubs', JSON.stringify(clubes));
            }
            if (roles && roles.length > 0) {
                localStorage.setItem('userRoles', JSON.stringify(roles));
            }
            if (permisos && permisos.length > 0) {
                localStorage.setItem('userPermissions', JSON.stringify(permisos));
            }
            if (plan) {
                localStorage.setItem('userPlan', JSON.stringify(plan));
            }

            // Actualizar estado
            state.user = user;
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            state.sessionId = sessionId;
            state.isAuthenticated = true;
            state.userClubs = clubes;
            state.userRoles = roles;
            state.permissions = permisos || [];
            state.userPlan = plan || null;

            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al iniciar sesi�n';
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

            // Si el backend devuelve tokens, hacemos auto-login (flujo antiguo o opcional)
            if (response.data.tokens) {
                const { usuario, tokens, clubes, permisos } = response.data;
                const user = usuario;
                const accessToken = tokens.access_token;
                const refreshToken = tokens.refresh_token;
                const sessionId = tokens.session_id;

                // Guardar en localStorage
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('sessionId', sessionId);
                if (clubes && clubes.length > 0) {
                    localStorage.setItem('userClubs', JSON.stringify(clubes));
                }
                if (permisos && permisos.length > 0) {
                    localStorage.setItem('userPermissions', JSON.stringify(permisos));
                }

                // Actualizar estado
                state.user = user;
                state.accessToken = accessToken;
                state.refreshToken = refreshToken;
                state.sessionId = sessionId;
                state.isAuthenticated = true;
                state.userClubs = clubes;
                state.permissions = permisos || [];
            }
            
            // Retornamos la respuesta completa para que el componente decida qu� hacer
            return response.data;
        } catch (error) {
            state.error = error.response?.data?.message || 'Error al crear cuenta';
            throw error;
        } finally {
            state.loading = false;
        }
    };

    const logout = async () => {
        try {
            if (state.sessionId) {
                await authAPI.logout(state.sessionId);
            }
        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('userClubs');
            localStorage.removeItem('userRoles');
            localStorage.removeItem('userPermissions');
            localStorage.removeItem('userPlan');
            
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionId = null;
            state.isAuthenticated = false;
            state.userClubs = [];
            state.userRoles = [];
            state.permissions = [];
            state.userPlan = null;
        }
    };

    const updateUserData = (userData) => {
        state.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const fetchUserProfile = async () => {
        if (!state.accessToken) return;
        
        try {
            const response = await authAPI.getProfile();
            const { usuario, clubes, roles, permisos, plan } = response.data;
            
            // Actualizar state
            if (usuario) {
                state.user = usuario;
                localStorage.setItem('user', JSON.stringify(usuario));
            }
            if (clubes) {
                state.userClubs = clubes;
                localStorage.setItem('userClubs', JSON.stringify(clubes));
            }
            if (roles) {
                state.userRoles = roles;
                localStorage.setItem('userRoles', JSON.stringify(roles));
            }
            if (permisos) {
                state.permissions = permisos;
                localStorage.setItem('userPermissions', JSON.stringify(permisos));
            }
            if (plan) {
                state.userPlan = plan;
                localStorage.setItem('userPlan', JSON.stringify(plan));
            }
            
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    };

    return {
        ...toRefs(state),
        state, // Expose reactive state object for direct access if needed
        login,
        register,
        logout,
        updateUserData,
        fetchUserProfile
    };
};
