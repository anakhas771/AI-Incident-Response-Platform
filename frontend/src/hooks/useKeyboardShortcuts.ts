import { useEffect } from 'react';
import { useCommandStore } from '../stores/useCommandStore';

export function useKeyboardShortcuts(): void {
  const {
    isCommandOpen,
    isShortcutsOpen,
    isCreateModalOpen,
    setCommandOpen,
    setShortcutsOpen,
    setCreateModalOpen,
    toggleSidebar,
  } = useCommandStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs or textareas unless it's Cmd+K or Escape
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd/Ctrl + K => Open Search / Command Palette
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(!isCommandOpen);
        return;
      }

      // Cmd/Ctrl + B => Toggle Sidebar
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Escape => Close any active modal/command palette
      if (event.key === 'Escape') {
        if (isCommandOpen) setCommandOpen(false);
        if (isShortcutsOpen) setShortcutsOpen(false);
        if (isCreateModalOpen) setCreateModalOpen(false);
        return;
      }

      // Skip non-modifier shortcuts if typing in input
      if (isInput) return;

      // '?' => Toggle Shortcuts Modal
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setShortcutsOpen(!isShortcutsOpen);
        return;
      }

      // 'c' or 'C' => Create New Incident modal
      if (event.key.toLowerCase() === 'c' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setCreateModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCommandOpen,
    isShortcutsOpen,
    isCreateModalOpen,
    setCommandOpen,
    setShortcutsOpen,
    setCreateModalOpen,
    toggleSidebar,
  ]);
}

export default useKeyboardShortcuts;
