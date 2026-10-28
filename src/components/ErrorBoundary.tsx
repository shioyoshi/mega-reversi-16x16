import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-3xl mb-4 shadow-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2">
            画面の読み込み中にエラーが発生しました
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            以前の保存データとの不整合が発生した可能性があります。
            「セーブデータを初期化して復旧」を押すと正常にゲームを再開できます。
          </p>
          <button
            onClick={this.handleReset}
            className="py-3 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95 transition"
          >
            セーブデータを初期化して復旧する 🔄
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
