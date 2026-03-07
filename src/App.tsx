import { useEffect, useState, useCallback, useMemo } from 'react';
import { Channel, Nation } from './types';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { AppHeader } from './components/AppHeader';
import { StreamInfo } from './components/StreamInfo';
import { useChannelData } from './hooks/useChannelData';
import { useFavorites } from './hooks/useFavorites';
import { useResponsive } from './hooks/useResponsive';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'legacy_iptv_last_channel';
const FAVORITES_NATION: Nation = { id: 'favorites', name: 'Favorites' };

export default function App() {
  const { allChannels, nations, isLoading, error } = useChannelData();
  const { favoriteUrls, favoriteNationIds, toggleFavorite, toggleFavoriteNation } = useFavorites();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useResponsive();

  const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Restore last channel after data loads
  useEffect(() => {
    if (!allChannels.length || !nations.length) return;

    const urlParams = new URLSearchParams(window.location.search);
    const stationId = urlParams.get('station');
    let found: Channel | undefined;

    if (stationId) {
      found = allChannels.find((c) => c.id === stationId);
    }

    if (!found) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const last = JSON.parse(saved);
          found = allChannels.find((c) => c.url === last.url);
        } catch { /* ignore corrupt storage */ }
      }
    }

    if (found) {
      setPlayingChannel(found);
      setSelectedChannel(found);
      const nation = nations.find((n) => n.name === found!.nation) ?? null;
      if (nation) setSelectedNation(nation);
      const params = new URLSearchParams(window.location.search);
      params.set('station', found.id);
      history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [allChannels, nations]);

  // Update channels list when selected nation or favorites change
  useEffect(() => {
    if (!selectedNation) {
      setChannels([]);
      return;
    }

    let nationChannels: Channel[];
    if (selectedNation.id === 'favorites') {
      nationChannels = favoriteUrls
        .map((url) => allChannels.find((c) => c.url === url))
        .filter((c): c is Channel => c !== undefined);
    } else {
      const filtered = allChannels.filter((c) => c.nation === selectedNation.name);
      const favs = filtered.filter((c) => favoriteUrls.includes(c.url));
      const others = filtered.filter((c) => !favoriteUrls.includes(c.url));
      nationChannels = [...favs, ...others];
    }

    setChannels(nationChannels);

    setSelectedChannel((prev) => {
      if (prev && nationChannels.find((c) => c.url === prev.url)) return prev;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const last = JSON.parse(saved);
          return nationChannels.find((c) => c.url === last.url) ?? null;
        } catch {
          return null;
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
    setPlayingChannel((prev) => {
      if (prev?.url === channel.url) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(channel));
      const params = new URLSearchParams(window.location.search);
      params.set('station', channel.id);
      history.replaceState(null, '', `?${params.toString()}`);
      return channel;
    });
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile, setIsSidebarOpen]);

  const filteredChannels = useMemo(
    () => channels.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [channels, searchQuery]
  );

  const displayNations = useMemo(() => {
    const filtered = nations.filter((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      const aFav = favoriteNationIds.includes(a.id);
      const bFav = favoriteNationIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [nations, favoriteNationIds, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        handleSelectNation(null);
      } else if (e.key >= '0' && e.key <= '9') {
        const index = e.key === '0' ? 9 : parseInt(e.key) - 1;
        if (selectedNation) {
          if (filteredChannels[index]) handleSelectChannel(filteredChannels[index]);
        } else {
          if (displayNations[index]) handleSelectNation(displayNations[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNation, filteredChannels, displayNations, handleSelectChannel, handleSelectNation]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
      {/* Mobile sidebar backdrop */}
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
          opacity: isSidebarOpen ? 1 : 0,
        }}
        className={cn(
          'fixed lg:relative z-50 h-full overflow-hidden',
          !isSidebarOpen && 'pointer-events-none'
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

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <AppHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          playingChannel={playingChannel}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {playingChannel ? (
            <div className="max-w-6xl mx-auto space-y-6">
              <VideoPlayer url={playingChannel.url} title={playingChannel.name} />
              <StreamInfo channel={playingChannel} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner">
                <TvIcon className="w-12 h-12 text-zinc-400 dark:text-zinc-700" />
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

function TvIcon({ className }: { className?: string }) {
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
      <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  );
}

function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}
