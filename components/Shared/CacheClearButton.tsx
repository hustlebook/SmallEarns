import React, { useState } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';

interface CacheClearButtonProps {
  className?: string;
}

export const CacheClearButton: React.FC<CacheClearButtonProps> = ({ className = '' }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<string | null>(null);

  const clearCache = async () => {
    setIsClearing(true);
    try {
      console.log('Starting aggressive cache clear...');

      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('Unregistering', registrations.length, 'service workers');
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // Clear ALL browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('Deleting', cacheNames.length, 'cache stores:', cacheNames);
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear ALL localStorage (except user business data)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!key.startsWith('smallearns_')) { // Preserve business data
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Set cache bypass flag
      localStorage.setItem('force_cache_bypass', Date.now().toString());

      setLastCleared(new Date().toLocaleTimeString());
      console.log('Cache clear complete, forcing hard refresh...');
      
      // iOS Safari requires more aggressive reload
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // Force hard reload with cache bypass for iOS
        window.location.href = window.location.href + '?v=' + Date.now();
      } else {
        // Hard reload for other browsers
        window.location.reload(true);
      }

    } catch (error) {
      console.error('Cache clear failed:', error);
      // Fallback - just reload
      window.location.reload();
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <button
      onClick={clearCache}
      disabled={isClearing}
      className={`
        inline-flex items-center space-x-2 px-3 py-1.5 text-xs rounded-md transition-colors duration-200
        ${isIOS 
          ? 'bg-blue-700/30 hover:bg-blue-600/40 text-blue-200 border border-blue-600/30' 
          : 'bg-gray-700/30 hover:bg-gray-600/40 text-gray-300 border border-gray-600/30'
        }
        ${isClearing ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={isIOS ? 'Force Safari to download latest updates' : 'Clear app cache and refresh'}
    >
      {isIOS && <Smartphone className="w-3 h-3" />}
      <RefreshCw className={`w-3 h-3 ${isClearing ? 'animate-spin' : ''}`} />
      <span>
        {isClearing ? 'Updating...' : isIOS ? 'Force Update' : 'Clear Cache'}
      </span>
      {lastCleared && (
        <span className="text-emerald-400">✓</span>
      )}
    </button>
  );
};