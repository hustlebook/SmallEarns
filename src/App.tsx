import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { useServiceWorker } from "@/hooks/usePWA";
import { BusinessProvider } from './contexts/BusinessContext';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { GlobalErrorBoundary } from './components/Shared/GlobalErrorBoundary';
import AppFooter from './components/AppFooter';

// Lazy load the main component for better performance
const SmallEarns = React.lazy(() => import('./components/SmallEarns'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-400">Loading SmallEarns...</p>
    </div>
  </div>
);

function App() {
  // Initialize service worker
  useServiceWorker();

  return (
    <>
      <GlobalErrorBoundary>
        <BusinessProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <SmallEarns />
            </Suspense>
          </ErrorBoundary>
        </BusinessProvider>
        <PWAInstallPrompt />
        <UpdatePrompt />
        <Toaster />
        <AppFooter />
      </GlobalErrorBoundary>
    </>
  );
}

export default App;
