import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Channel, ChannelGroup, Nation } from './types';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { Menu, X, Info, Github, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DATA_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
const STORAGE_KEY = 'legacy_iptv_last_channel';

export default function App() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>([]);
  const [favoriteNationIds, setFavoriteNationIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const FAVORITES_STORAGE_KEY = 'legacy_iptv_favorites';
  const FAVORITE_NATIONS_STORAGE_KEY = 'legacy_iptv_favorite_nations';
  const FAVORITES_NATION: Nation = { id: 'favorites', name: 'Favorites' };

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

  useEffect(() => {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (savedFavorites) {
      try {
        setFavoriteUrls(JSON.parse(savedFavorites));
      } catch (e) { }
    }

    const savedFavoriteNations = localStorage.getItem(FAVORITE_NATIONS_STORAGE_KEY);
    if (savedFavoriteNations) {
      try {
        setFavoriteNationIds(JSON.parse(savedFavoriteNations));
      } catch (e) { }
    }
  }, []);

  const toggleFavorite = useCallback((url: string) => {
    setFavoriteUrls(prev => {
      const newFavorites = prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const toggleFavoriteNation = useCallback((id: string) => {
    setFavoriteNationIds(prev => {
      const newFavorites = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id];
      localStorage.setItem(FAVORITE_NATIONS_STORAGE_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const parseM3U8 = useCallback((text: string): Channel[] => {
    const lines = text.split('\n');
    const channels: Channel[] = [];
    let currentChannel: Partial<Channel> = {};

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('#EXTINF:')) {
        // Parse metadata
        // Example: #EXTINF:-1 tvg-id="" tvg-name="1HD Music Television" tvg-logo="https://i.imgur.com/kHhX2kH.png" group-title="Music",1HD Music Television

        const logoMatch = trimmedLine.match(/tvg-logo="(.*?)"/);
        const groupMatch = trimmedLine.match(/group-title="(.*?)"/);
        const nameMatch = trimmedLine.split(',').pop(); // Get everything after the last comma

        // Extract nation from group-title if it exists (usually format is "Nation;Category" or just "Nation")
        let category = 'General';
        let nation = 'Unknown';

        if (groupMatch && groupMatch[1]) {
          const parts = groupMatch[1].split(';');
          if (parts.length > 1) {
            nation = parts[0].trim();
            category = parts[1].trim();
          } else {
            nation = parts[0].trim();
          }
        }

        currentChannel = {
          id: `ch-${channels.length}`,
          name: nameMatch ? nameMatch.trim() : 'Unknown Channel',
          logo: logoMatch ? logoMatch[1] : undefined,
          category,
          nation
        };
      } else if (trimmedLine && !trimmedLine.startsWith('#')) {
        // This is the URL
        if (currentChannel.name) {
          channels.push({
            ...currentChannel,
            url: trimmedLine
          } as Channel);
          currentChannel = {};
        }
      }
    });

    return channels;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch channel list');
        const text = await response.text();
        const parsedChannels = parseM3U8(text);
        setAllChannels(parsedChannels);

        // Extract unique nations
        const uniqueNations = Array.from(new Set(parsedChannels.map(c => c.nation).filter(Boolean))) as string[];
        const nationList: Nation[] = uniqueNations.map(n => ({
          id: n.toLowerCase().replace(/\s+/g, '-'),
          name: n
        })).sort((a, b) => a.name.localeCompare(b.name));

        setNations(nationList);

        // Restore last playing channel — URL param takes precedence over localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const stationId = urlParams.get('station');
        let found: Channel | undefined;

        if (stationId) {
          found = parsedChannels.find(c => c.id === stationId);
        }

        if (!found) {
          const savedChannel = localStorage.getItem(STORAGE_KEY);
          if (savedChannel) {
            try {
              const last = JSON.parse(savedChannel);
              found = parsedChannels.find(c => c.url === last.url);
            } catch (e) { }
          }
        }

        if (found) {
          setPlayingChannel(found);
          setSelectedChannel(found);
          const nation = nationList.find(n => n.name === found!.nation) || null;
          if (nation) setSelectedNation(nation);
          // Sync URL to reflect the loaded channel
          const params = new URLSearchParams(window.location.search);
          params.set('station', found.id);
          history.replaceState(null, '', `?${params.toString()}`);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [parseM3U8]);

  // Update channels when nation changes
  useEffect(() => {
    if (!selectedNation) {
      setChannels([]);
      return;
    }

    let nationChannels: Channel[] = [];
    if (selectedNation.id === 'favorites') {
      // Map favoriteUrls to actual channel objects, keeping the order they were added
      nationChannels = favoriteUrls
        .map(url => allChannels.find(c => c.url === url))
        .filter((c): c is Channel => c !== undefined);
    } else {
      const filtered = allChannels.filter(c => c.nation === selectedNation.name);
      const favorites = filtered.filter(c => favoriteUrls.includes(c.url));
      const others = filtered.filter(c => !favoriteUrls.includes(c.url));
      nationChannels = [...favorites, ...others];
    }

    setChannels(nationChannels);

    // Keep current channel if it exists in the new nation's channel list
    setSelectedChannel(prev => {
      if (prev && nationChannels.find(c => c.url === prev.url)) {
        return prev;
      }
      // Otherwise restore last saved channel if it belongs to this nation
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const lastChannel = JSON.parse(saved);
          return nationChannels.find(c => c.url === lastChannel.url) ?? null;
        } catch (e) {
          console.error('Error parsing saved channel', e);
        }
      }
      return null;
    });
  }, [selectedNation, allChannels, favoriteUrls]);

  const handleSelectNation = useCallback((nation: Nation | null) => {
    setSelectedNation(nation);
    setSearchQuery('');
  }, []);

  const handleSelectChannel = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setPlayingChannel(prev => {
      if (prev?.url === channel.url) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(channel));
      const params = new URLSearchParams(window.location.search);
      params.set('station', channel.id);
      history.replaceState(null, '', `?${params.toString()}`);
      return channel;
    });
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const displayNations = useMemo(() => {
    const filtered = nations.filter(nation =>
      nation.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedNations = [...filtered].sort((a, b) => {
      const aFav = favoriteNationIds.includes(a.id);
      const bFav = favoriteNationIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
    return sortedNations;
  }, [nations, favoriteNationIds, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Escape') {
        handleSelectNation(null);
      } else if (e.key >= '0' && e.key <= '9') {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1;
        if (selectedNation) {
          if (filteredChannels[index]) {
            handleSelectChannel(filteredChannels[index]);
          }
        } else {
          if (displayNations[index]) {
            handleSelectNation(displayNations[index]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNation, filteredChannels, displayNations, handleSelectChannel, handleSelectNation]);

  if (isLoading) {
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
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Initializing compatibility layer...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Connection Error</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">{error}</p>
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
    <div className="flex h-screen bg-zinc-50 dark:bg-black text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-zinc-900/20 dark:bg-black/80 backdrop-blur-sm z-40"
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
          nations={displayNations}
          selectedNation={selectedNation}
          onSelectNation={handleSelectNation}
          channels={filteredChannels}
          selectedChannel={selectedChannel}
          onSelectChannel={handleSelectChannel}
          favoriteUrls={favoriteUrls}
          onToggleFavorite={toggleFavorite}
          favoriteNationIds={favoriteNationIds}
          onToggleFavoriteNation={toggleFavoriteNation}
          favoritesNation={FAVORITES_NATION}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
              href="https://github.com/Free-TV/IPTV"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Source Repository"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </header>

        {/* Player Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {playingChannel ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <VideoPlayer
                url={playingChannel.url}
                title={playingChannel.name}
              />

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
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{playingChannel.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Category</label>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{playingChannel.category}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Stream URL</label>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] bg-zinc-100 dark:bg-black/50 p-2 rounded border border-zinc-200 dark:border-zinc-800 flex-1 truncate text-zinc-600 dark:text-zinc-400">
                          {playingChannel.url}
                        </code>
                        <a
                          href={playingChannel.url}
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
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <Tv className="w-12 h-12 text-zinc-400 dark:text-zinc-700" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">No Station Selected</h2>
                <p className="text-zinc-500 max-w-xs mx-auto">Choose a channel from the sidebar to start watching live television.</p>
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
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
    </svg>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
