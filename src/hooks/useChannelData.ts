import { useState, useEffect } from 'react';
import { Channel, Nation } from '../types';
import { parseM3U8 } from '../lib/parseM3U8';

const DATA_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

export function useChannelData() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch channel list');
        const text = await response.text();
        const parsed = parseM3U8(text);
        setAllChannels(parsed);

        const uniqueNations = Array.from(
          new Set(parsed.map((c) => c.nation).filter(Boolean))
        ) as string[];
        const nationList: Nation[] = uniqueNations
          .map((n) => ({ id: n.toLowerCase().replace(/\s+/g, '-'), name: n }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setNations(nationList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { allChannels, nations, isLoading, error };
}
