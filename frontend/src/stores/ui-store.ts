import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * UI Store - Zustand
 *
 * Manages global UI state (modals, sidebars, themes, etc.)
 */

type Theme = 'dark' | 'light' | 'system';
type ModalType = 'shortcuts' | 'create-playlist' | 'create-station' | 'settings' | null;

interface UIState {
    // Modals
    activeModal: ModalType;
    modalData: any;

    // Theme
    theme: Theme;

    // Sidebar/Navigation
    sidebarOpen: boolean;

    // Search
    searchOpen: boolean;
    searchQuery: string;

    // Player
    playerMinimized: boolean;

    // Actions - Modals
    openModal: (type: ModalType, data?: any) => void;
    closeModal: () => void;

    // Actions - Theme
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;

    // Actions - Sidebar
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;

    // Actions - Search
    setSearchOpen: (open: boolean) => void;
    setSearchQuery: (query: string) => void;

    // Actions - Player
    togglePlayerMinimized: () => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            // Initial state
            activeModal: null,
            modalData: null,
            theme: 'dark',
            sidebarOpen: true,
            searchOpen: false,
            searchQuery: '',
            playerMinimized: false,

            // Modal actions
            openModal: (type, data) => set({
                activeModal: type,
                modalData: data || null,
            }),

            closeModal: () => set({
                activeModal: null,
                modalData: null,
            }),

            // Theme actions
            setTheme: (theme) => set({ theme }),

            toggleTheme: () => {
                const current = get().theme;
                set({ theme: current === 'dark' ? 'light' : 'dark' });
            },

            // Sidebar actions
            toggleSidebar: () => set((state) => ({
                sidebarOpen: !state.sidebarOpen,
            })),

            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            // Search actions
            setSearchOpen: (open) => set({ searchOpen: open }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            // Player actions
            togglePlayerMinimized: () => set((state) => ({
                playerMinimized: !state.playerMinimized,
            })),
        }),
        { name: 'UIStore' }
    )
);

/**
 * Selectors
 */
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useSearchQuery = () => useUIStore((state) => state.searchQuery);
