import { create } from 'zustand';

interface CommandStoreState {
  isCommandOpen: boolean;
  isCreateModalOpen: boolean;
  isShortcutsOpen: boolean;
  isSidebarCollapsed: boolean;
  setCommandOpen: (open: boolean) => void;
  setCreateModalOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useCommandStore = create<CommandStoreState>((set) => ({
  isCommandOpen: false,
  isCreateModalOpen: false,
  isShortcutsOpen: false,
  isSidebarCollapsed: false,
  setCommandOpen: (open) => set({ isCommandOpen: open }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
