import { reactive, computed } from 'vue';
import { clubsAPI, membershipAPI } from '../api';
import { useAuthStore } from './auth';

export const getSportIcon = (deporte) => {
    const sport = (deporte || '').toString().trim().toLowerCase();

    if (sport === 'basquetbol') return '🏀';
    if (sport === 'voleibol') return '🏐';
    if (sport === 'rugby') return '🏉';
    if (sport === 'futbol' || sport === 'futbolito' || sport === 'babyfutbol' || sport === 'futsal') return '⚽';

    return '🎽';
};

const state = reactive({
    clubs: (() => {
        try {
            const stored = localStorage.getItem('userClubs');
            if (!stored || stored === 'undefined') return [];
            const clubs = JSON.parse(stored);
            console.log('🔍 Initial clubs from localStorage:', clubs);
            return clubs;
        } catch (e) {
            console.error('Error parsing stored clubs', e);
            return [];
        }
    })(),
    selectedClub: (() => {
        try {
            const stored = localStorage.getItem('selectedClub');
            if (!stored || stored === 'undefined') return null;
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing selectedClub', e);
            return null;
        }
    })(),
    subscription: null, // Suscripción actual del club seleccionado
    loading: false,
    error: null,
});

export const useClubStore = () => {
    const authStore = useAuthStore();


    const loadSubscription = async (clubId) => {
        if (!clubId) {
            state.subscription = null;
            return;
        }
        try {
            const response = await membershipAPI.getSuscripcion(clubId);
            state.subscription = response.data;
        } catch (error) {
            // Si es 404, asumimos plan FREE
            if (error.response && error.response.status === 404) {
                 state.subscription = { plan: { codigo: 'free', nombre: 'Barrio Libre' } };
            } else {
                 console.error('Error loading subscription:', error);
                 state.subscription = null; 
            }
        }
    };

    const loadClubs = async () => {
        state.loading = true;
        state.error = null;

        try {
            const userId = authStore.user.value?.id;
            if (!userId) {
                state.loading = false;
                return;
            }

            const response = await clubsAPI.getAll({ owner_id: userId });
            const freshClubs = Array.isArray(response.data) ? response.data : [];

            console.log('🔍 Clubs loaded from API:', freshClubs);

            state.clubs = freshClubs;
            // Update localStorage
            localStorage.setItem('userClubs', JSON.stringify(freshClubs));

            // If selected club is not in the list (e.g. deleted), clear it
            if (state.selectedClub && !state.clubs.find(c => c.id === state.selectedClub.id)) {
                setSelectedClub(null);
            }
        } catch (error) {
            console.error('Error loading clubs:', error);
            // If we have stored clubs, don't show error, just log it
            if (state.clubs.length === 0) {
                state.error = 'Error al cargar los clubes';
            }
        } finally {
            state.loading = false;
        }
    };

    const setSelectedClub = async (club) => {
        console.log('🔍 Selected club set:', club);
        state.selectedClub = club || null;
        if (club) {
            localStorage.setItem('selectedClub', JSON.stringify(club));
            await loadSubscription(club.id);
        } else {
            localStorage.removeItem('selectedClub');
            state.subscription = null;
        }
    };

    const clearState = () => {
        state.clubs = [];
        state.selectedClub = null;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('selectedClub');
    };

    // Initial load if club is selected
    if (state.selectedClub && !state.subscription) {
        loadSubscription(state.selectedClub.id);
    }

    return {
        state,
        clubs: computed(() => state.clubs),
        selectedClub: computed(() => state.selectedClub),
        subscription: computed(() => state.subscription),
        loading: computed(() => state.loading),
        loadClubs,
        setSelectedClub,
        clearState,
        loadSubscription,
    };
};
