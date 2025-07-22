import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 m-4">
          <h3 className="text-red-400 font-semibold mb-2">Something went wrong</h3>
          <p className="text-gray-300 text-sm">
            This section encountered an error. Please refresh the page or try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}