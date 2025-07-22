import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Copy, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { exportAllData, importAllData, clearAllStorage } from '../../lib/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleExportJSON = () => {
    try {
      const data = exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smallearns-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus('success');
      setMessage('Backup downloaded successfully!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to create backup. Please try again.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const data = exportAllData();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setStatus('success');
      setMessage('Backup copied to clipboard!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to copy to clipboard. Please try download instead.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (window.confirm('This will replace all your current data. Are you sure you want to continue?')) {
          clearAllStorage();
          const success = importAllData(data);
          
          if (success) {
            setStatus('success');
            setMessage('Data restored successfully! Please refresh the page.');
            setTimeout(() => window.location.reload(), 2000);
          } else {
            setStatus('error');
            setMessage('Failed to restore data. Please check the file format.');
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage('Invalid backup file. Please check the file format.');
        setTimeout(() => setStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100">Backup & Restore</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Backup Data
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'restore'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Restore Data
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Status Message */}
            {status !== 'idle' && (
              <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
                status === 'success' ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'
              }`}>
                {status === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                <span className="text-sm">{message}</span>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Export all your SmallEarns data to keep it safe. Your privacy is protected - data stays on your device.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleExportJSON}
                    className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Download size={20} />
                    <span>Download Backup File</span>
                  </button>
                  
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Copy size={20} />
                    <span>Copy to Clipboard</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'restore' && (
              <div className="space-y-4">
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-yellow-200">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">Warning</span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-1">
                    This will replace all your current data. Make sure to backup first!
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Choose backup file:
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:cursor-pointer hover:file:bg-emerald-700"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};