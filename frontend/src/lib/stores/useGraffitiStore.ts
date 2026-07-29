import { create } from 'zustand';

export interface GraffitiTag {
    id: string;
    text: string;
    color: string;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    rotation: number; // Degrees -20 to 20
    timestamp: number;
}

interface GraffitiStore {
    tags: GraffitiTag[];
    addTag: (text: string) => void;
    removeTag: (id: string) => void;
    clearTags: () => void;
}

const COLORS = [
    '#FF0099', // Neon Pink
    '#00FFCC', // Cyan
    '#FFFF00', // Yellow
    '#FF3300', // Red-Orange
    '#CC00FF', // Purple
    '#00FF00', // Lime
];

export const useGraffitiStore = create<GraffitiStore>((set) => ({
    tags: [],
    addTag: (text: string) => {
        const newTag: GraffitiTag = {
            id: Math.random().toString(36).substring(7),
            text,
            color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#FF6B6B',
            x: Math.random() * 80 + 10, // Keep away from extreme edges
            y: Math.random() * 80 + 10,
            rotation: Math.random() * 40 - 20,
            timestamp: Date.now(),
        };

        set((state) => ({ tags: [...state.tags, newTag] }));

        // Auto-remove after animation duration (e.g., 4s)
        setTimeout(() => {
            set((state) => ({
                tags: state.tags.filter((t) => t.id !== newTag.id),
            }));
        }, 4000);
    },
    removeTag: (id) =>
        set((state) => ({ tags: state.tags.filter((t) => t.id !== id) })),
    clearTags: () => set({ tags: [] }),
}));
