import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Specialized React Error Boundary for the AI Copilot console.
 * Catches rendering exceptions and provides immediate recovery without crashing the app.
 */
export class ChatErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatErrorBoundary caught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-6 bg-zinc-950 text-zinc-300 text-center">
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-400 mb-4">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-100 mb-1">Copilot UI Render Exception</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-4 font-mono">
            {this.state.error?.message ||
              'An unexpected error occurred in the AI Copilot workspace.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recover Chat Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;
