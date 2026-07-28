import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React Error Boundary Caught]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full glass-panel p-8 rounded-xl border border-red-500/20 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-semibold text-red-400">Application Error</h2>
            <p className="text-sm text-slate-400">
              {this.state.error?.message || 'An unexpected error occurred in the component tree.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
