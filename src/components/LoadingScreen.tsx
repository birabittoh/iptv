import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight italic serif">IPTV</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing...</p>
        </div>
      </motion.div>
    </div>
  );
}
