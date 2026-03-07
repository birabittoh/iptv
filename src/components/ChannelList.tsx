import React, { useRef, useEffect } from 'react';
import { Search, Filter, PlayCircle, Globe, ChevronLeft, Star } from 'lucide-react';
import { Channel, Nation } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChannelListProps {
  nations: Nation[];
  selectedNation: Nation | null;
  onSelectNation: (nation: Nation | null) => void;
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  favoriteUrls: string[];
  onToggleFavorite: (url: string) => void;
  favoriteNationIds: string[];
  onToggleFavoriteNation: (id: string) => void;
  favoritesNation: Nation;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({ 
  nations, 
  selectedNation, 
  onSelectNation,
  channels, 
  selectedChannel, 
  onSelectChannel,
  favoriteUrls,
  onToggleFavorite,
  favoriteNationIds,
  onToggleFavoriteNation,
  favoritesNation,
  searchQuery,
  onSearchChange
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when nation changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedNation]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Search Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {selectedNation ? (
            <button
              onClick={() => {
                onSelectNation(null);
              }}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-emerald-500/50 transition-all"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onSelectNation(favoritesNation);
              }}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-emerald-500/50 transition-all"
              title="Favorites"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder={selectedNation ? "Search channels..." : "Search regions..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {selectedNation && (
        <div className="px-4 pb-2">
          <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">{selectedNation.name}</h2>
        </div>
      )}

      {/* List Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1"
      >
        {!selectedNation ? (
          // Nations List
          nations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
              <Globe className="w-12 h-12 mb-2 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No regions found</p>
            </div>
          ) : (
            <div className="space-y-0.5 ml-2">
              {nations.map((nation) => (
                <button
                  key={nation.id}
                  onClick={() => {
                    onSelectNation(nation);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all group relative overflow-hidden text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500/30 transition-colors">
                    <Globe className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate leading-tight">
                      {nation.name}
                    </div>
                  </div>

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteNation(nation.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4 transition-colors",
                        favoriteNationIds.includes(nation.id) ? "fill-amber-500 text-amber-500" : "text-zinc-400 hover:text-amber-500"
                      )}
                    />
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          // Channels List
          channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
              <Filter className="w-12 h-12 mb-2 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No channels found</p>
            </div>
          ) : (
            <div className="space-y-0.5 ml-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all group relative overflow-hidden",
                    selectedChannel?.id === channel.id 
                      ? "bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {selectedChannel?.id === channel.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  )}
                  
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500/30 transition-colors",
                    selectedChannel?.id === channel.id && "border-emerald-500/50"
                  )}>
                    {channel.logo ? (
                      <img 
                        src={channel.logo} 
                        alt="" 
                        className="w-6 h-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <PlayCircle className="w-4 h-4 opacity-50" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate leading-tight">
                      {channel.name}
                    </div>
                  </div>

                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(channel.url);
                    }}
                    className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex-shrink-0"
                  >
                    <Star 
                      className={cn(
                        "w-4 h-4 transition-colors", 
                        favoriteUrls.includes(channel.url) ? "fill-amber-500 text-amber-500" : "text-zinc-400 hover:text-amber-500"
                      )} 
                    />
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  );
};
