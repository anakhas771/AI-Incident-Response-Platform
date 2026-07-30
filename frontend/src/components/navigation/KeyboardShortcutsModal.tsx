import React, { useEffect } from 'react';
import { useCommandStore } from '../../store/useCommandStore';
import { Modal } from '../ui/Modal';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setShortcutsOpen } = useCommandStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        setShortcutsOpen(!isShortcutsOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, setShortcutsOpen]);

  const shortcuts = [
    { key: '⌘ K', description: 'Open Command Palette' },
    { key: 'C', description: 'Report New Incident' },
    { key: 'G then D', description: 'Navigate to Dashboard' },
    { key: 'G then I', description: 'Navigate to Incidents Queue' },
    { key: 'G then A', description: 'Launch AI Copilot Console' },
    { key: 'ESC', description: 'Close Modals & Drawers' },
    { key: '?', description: 'Toggle Keyboard Shortcuts' },
  ];

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
      title="Keyboard Shortcuts"
      description="Efficiency shortcuts designed for enterprise SOC workflows."
      maxWidth="md"
    >
      <div className="space-y-3">
        {shortcuts.map((sc) => (
          <div key={sc.key} className="flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs">
            <span className="text-zinc-300 font-medium">{sc.description}</span>
            <kbd className="px-2 py-1 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-[11px] font-semibold">
              {sc.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
};
