import React, { Component, ReactNode } from 'react';
import { exportAllData } from '../../lib/storage';
import { Download, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Global error caught:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      };
      localStorage.setItem('smallearns_error_log', JSON.stringify(errorLog));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleExportData = () => {
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
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try refreshing the page.');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center border border-red-500">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-300 mb-6">
              SmallEarns encountered an unexpected error. Your data is safe - you can export it before refreshing.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleExportData}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download size={20} />
                <span>Export My Data</span>
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <RefreshCw size={20} />
                <span>Reload App</span>
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-gray-400 text-sm">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-300 bg-gray-900 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}