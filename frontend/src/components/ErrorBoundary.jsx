import React from "react";
import { Heart, RefreshCw, Home, ShieldAlert } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[HeartLink ErrorBoundary caught]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#151219] text-[#F8DCE5] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1D1822] border border-[#681D3B]/40 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#681D3B] to-[#F45B83] shadow-lg shadow-rose-900/30">
              <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
                HeartLink Missed a Beat
              </h2>
              <p className="text-sm text-[#A9A1AC]">
                We encountered an unexpected display issue. Your account, messages, and matches are completely safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#E61E50] hover:bg-[#D01845] active:bg-[#B9143C] text-white text-sm font-semibold shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="text-left mt-4 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-rose-300 overflow-auto max-h-40">
                <summary className="cursor-pointer font-mono text-[11px] text-[#A9A1AC] hover:text-white flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Technical Error Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
