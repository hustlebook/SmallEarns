import React from 'react';

// Mobile-specific component to enhance touch interactions
export const MobileOptimizations: React.FC = () => {
  React.useEffect(() => {
    // Add mobile-specific meta tags
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Add mobile-specific CSS classes to body
    document.body.classList.add('mobile-optimized');

    // Add touch event listeners for better mobile interaction
    const addTouchFeedback = (element: HTMLElement) => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'transform 0.1s ease';
      });

      element.addEventListener('touchend', () => {
        element.style.transform = 'scale(1)';
      });
    };

    // Apply touch feedback to all buttons
    const buttons = document.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons.forEach(addTouchFeedback);

    // Cleanup
    return () => {
      document.body.classList.remove('mobile-optimized');
    };
  }, []);

  return null; // This component doesn't render anything
};

// Hook for mobile-specific utilities
export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isLandscape, setIsLandscape] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return { isMobile, isLandscape };
};

// Mobile-specific error boundary
export class MobileErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-error-fallback p-4 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-4">
            We're sorry, but something went wrong. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mobile-btn bg-emerald-600 text-white"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileOptimizations;