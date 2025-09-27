import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filename: string) => void;
  initialName: string;
  isLoadingName: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, initialName, isLoadingName }) => {
  const [filename, setFilename] = useState(initialName);

  useEffect(() => {
    // When a new initial name is suggested, update the input.
    if (!isLoadingName) {
      setFilename(initialName);
    }
  }, [initialName, isLoadingName]);

  const handleExportClick = () => {
    // Sanitize filename one last time before exporting
    const finalFilename = filename.trim().replace(/\s+/g, '-') || 'AI-Photoshoot-Export';
    onExport(finalFilename);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Batch Export</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
          The AI has suggested a name for your export file. You can edit it below.
        </p>

        <div className="mb-6">
          <label htmlFor="filename" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Filename (.zip)
          </label>
          <div className="relative">
            <input
              id="filename"
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="Suggesting a name..."
              disabled={isLoadingName}
              className="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-md border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 pr-10"
            />
            {isLoadingName && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="w-5 h-5 border-2 border-t-transparent border-teal-400 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-semibold hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExportClick}
            disabled={isLoadingName || !filename.trim()}
            className="px-4 py-2 rounded-md bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            <Icon name="download" className="w-5 h-5" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};