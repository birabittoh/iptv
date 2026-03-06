import React, { useEffect, useState, useCallback } from 'react';
import { Channel, ChannelGroup } from './types';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { Menu, X, Info, Github, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DATA_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/refs/heads/master/lists/italy.md';
const STORAGE_KEY = 'legacy_iptv_last_channel';

export default function App() {
  const [groups, setGroups] = useState<ChannelGroup[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const parseMarkdown = useCallback((text: string): ChannelGroup[] => {
    const lines = text.split('\n');
    const groups: ChannelGroup[] = [];
    let currentCategory = 'General';
    let currentChannels: Channel[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Category headers
      const h2Match = trimmedLine.match(/^<h2>(.*?)<\/h2>$/i);
      if (trimmedLine.startsWith('## ') || h2Match) {
        if (currentChannels.length > 0) {
          groups.push({ category: currentCategory, channels: currentChannels });
        }
        currentCategory = h2Match ? h2Match[1].trim() : trimmedLine.replace(/^##\s+/, '').trim();
        currentChannels = [];
      } 
      // Table rows: | # | Channel | Link | Logo | EPG id |
      else if (trimmedLine.startsWith('|') && !trimmedLine.includes('---') && !trimmedLine.toLowerCase().includes('channel')) {
        const parts = trimmedLine.split('|').map(p => p.trim()).filter(p => p !== '');
        if (parts.length >= 3) {
          // parts[0] is the number/id, parts[1] is the name, parts[2] is the link, parts[3] is the logo
          let name = parts[1] || '';
          name = name.replace(/\[(.*?)\]\(.*?\)/, '$1'); // Extract name from markdown link if present
          
          let logo;
          if (parts[3]) {
            const logoMatch = parts[3].match(/src="(.*?)"/) || parts[3].match(/\((.*?)\)/);
            logo = logoMatch ? logoMatch[1] : undefined;
          }

          const urlMatch = parts[2]?.match(/\((.*?)\)/) || [null, parts[2]];
          const url = urlMatch[1] || parts[2];

          if (url && url.startsWith('http')) {
            currentChannels.push({
              id: `ch-${index}`,
              name,
              url,
              category: currentCategory,
              logo: logo?.startsWith('http') ? logo : undefined
            });
          }
        }
      }
      // List items: * [Name](URL)
      else if (trimmedLine.startsWith('* [') || trimmedLine.startsWith('- [')) {
        const match = trimmedLine.match(/[*-]\s\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, name, url] = match;
          currentChannels.push({
            id: `ch-${index}`,
            name,
            url,
            category: currentCategory
          });
        }
      }
    });

    if (currentChannels.length > 0) {
      groups.push({ category: currentCategory, channels: currentChannels });
    }

    return groups;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch channel list');
        const text = await response.text();
        const parsedGroups = parseMarkdown(text);
        setGroups(parsedGroups);

        // Restore last channel
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const lastChannel = JSON.parse(saved);
            // Verify it still exists in the new list
            const found = parsedGroups.flatMap(g => g.channels).find(c => c.url === lastChannel.url);
            if (found) setSelectedChannel(found);
            else if (parsedGroups.length > 0 && parsedGroups[0].channels.length > 0) {
              setSelectedChannel(parsedGroups[0].channels[0]);
            }
          } catch (e) {
            console.error('Error parsing saved channel', e);
          }
        } else if (parsedGroups.length > 0 && parsedGroups[0].channels.length > 0) {
          setSelectedChannel(parsedGroups[0].channels[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [parseMarkdown]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channel));
    if (isMobile) setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight italic serif">IPTV</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing compatibility layer...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
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

  return (
    <div className="flex h-screen bg-black text-zinc-200 overflow-hidden font-sans">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? '85%' : '320px') : '0px',
          x: isSidebarOpen ? 0 : (isMobile ? -320 : 0),
          opacity: isSidebarOpen ? 1 : 0
        }}
        className={cn(
          "fixed lg:relative z-50 h-full overflow-hidden",
          !isSidebarOpen && "pointer-events-none"
        )}
      >
        <ChannelList 
          groups={groups} 
          selectedChannel={selectedChannel} 
          onSelectChannel={handleSelectChannel} 
        />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-white truncate max-w-[200px] lg:max-w-md">
                {selectedChannel ? selectedChannel.name : 'Select a Station'}
              </h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                {selectedChannel ? selectedChannel.category : 'No channel selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <a 
              href="https://github.com/Free-TV/IPTV" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-white transition-colors"
              title="Source Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Player Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {selectedChannel ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <VideoPlayer 
                url={selectedChannel.url} 
                title={selectedChannel.name} 
              />
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-bold text-white">Stream Information</h3>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Station Name</label>
                        <p className="text-sm font-medium text-zinc-200">{selectedChannel.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Category</label>
                        <p className="text-sm font-medium text-zinc-200">{selectedChannel.category}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Stream URL</label>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] bg-black/50 p-2 rounded border border-zinc-800 flex-1 truncate text-zinc-400">
                          {selectedChannel.url}
                        </code>
                        <a 
                          href={selectedChannel.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-inner">
                <Tv className="w-12 h-12 text-zinc-700" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">No Station Selected</h2>
                <p className="text-zinc-500 max-w-xs mx-auto">Choose a channel from the sidebar to start watching live Italian television.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Tv({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
    </svg>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
