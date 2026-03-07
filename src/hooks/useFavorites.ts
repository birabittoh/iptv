import { useState, useCallback } from 'react';

const FAVORITES_KEY = 'legacy_iptv_favorites';
const FAVORITE_NATIONS_KEY = 'legacy_iptv_favorite_nations';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useFavorites() {
  const [favoriteUrls, setFavoriteUrls] = useState<string[]>(() =>
    loadFromStorage<string[]>(FAVORITES_KEY, [])
  );
  const [favoriteNationIds, setFavoriteNationIds] = useState<string[]>(() =>
    loadFromStorage<string[]>(FAVORITE_NATIONS_KEY, [])
  );

  const toggleFavorite = useCallback((url: string) => {
    setFavoriteUrls((prev) => {
      const next = prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavoriteNation = useCallback((id: string) => {
    setFavoriteNationIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem(FAVORITE_NATIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { favoriteUrls, favoriteNationIds, toggleFavorite, toggleFavoriteNation };
}
