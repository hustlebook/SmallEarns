import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const DataBackupNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show notice after 30 seconds if not dismissed
    const dismissed = localStorage.getItem('backupNoticeDismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('backupNoticeDismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-emerald-800 border border-emerald-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Download className="text-emerald-300 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm text-emerald-100 font-medium mb-1">
              💾 Backup Reminder
            </p>
            <p className="text-xs text-emerald-200">
              Your data is stored locally. Export a backup occasionally from Reports!
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-emerald-300 hover:text-emerald-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataBackupNotice;