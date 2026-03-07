import { Info, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { Channel } from '../types';

export function StreamInfo({ channel }: { channel: Channel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-6"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Stream Information</h3>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Station Name</label>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{channel.name}</p>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Category</label>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{channel.category}</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Stream URL</label>
            <div className="flex items-center gap-2">
              <code className="text-[10px] bg-zinc-100 dark:bg-black/50 p-2 rounded border border-zinc-200 dark:border-zinc-800 flex-1 truncate text-zinc-600 dark:text-zinc-400">
                {channel.url}
              </code>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
