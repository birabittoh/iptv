import { AlertTriangle } from 'lucide-react';

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Connection Error</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
