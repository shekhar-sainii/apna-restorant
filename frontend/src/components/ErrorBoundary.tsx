import { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "./common/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-8 shadow-2xl">
            <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black mb-3 text-slate-850 dark:text-slate-100">Something Went Wrong</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              An unexpected crash happened in the application interface. Don't worry, you can try reloading the session.
            </p>
            <Button onClick={this.handleReload} variant="primary" className="w-full">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
