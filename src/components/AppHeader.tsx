import { Menu, X, Github } from 'lucide-react';
import { Channel } from '../types';

interface AppHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  playingChannel: Channel | null;
}

export function AppHeader({ isSidebarOpen, onToggleSidebar, playingChannel }: AppHeaderProps) {
  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="hidden md:block border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-2">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate max-w-[200px] lg:max-w-md">
            {playingChannel ? playingChannel.name : 'Select a Station'}
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            {playingChannel ? playingChannel.category : 'No channel selected'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <a
          href="https://github.com/birabittoh/iptv"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Source Repository"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  );
}
