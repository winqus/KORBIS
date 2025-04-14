import { Alert } from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";

interface UseSupabaseOptions<T, P extends Record<string, string | number>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
  cacheKey?: string;
}

interface UseSupabaseReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
  invalidateCache: (key?: string) => void;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  params: string;
}

const CACHE_EXPIRY = 5 * 60 * 1000; /* 5 minutes in milliseconds */

const globalCache = new Map<string, CacheEntry<any>>();

export const useSupabase = <T, P extends Record<string, string | number>>({
  fn,
  params = {} as P,
  skip = false,
  cacheKey,
}: UseSupabaseOptions<T, P>): UseSupabaseReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = useCallback(
    (params: P): string => {
      if (cacheKey) return cacheKey;
      return `${fn.name}_${JSON.stringify(params)}`;
    },
    [fn, cacheKey],
  );

  const isValidCache = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < CACHE_EXPIRY;
  }, []);

  const invalidateCache = useCallback(
    (key?: string) => {
      if (key) {
        globalCache.delete(key);
      } else {
        const prefix = `${fn.name}_`;
        for (const k of globalCache.keys()) {
          if (k.startsWith(prefix)) {
            globalCache.delete(k);
          }
        }
      }
    },
    [fn.name],
  );

  const fetchData = useCallback(
    async (fetchParams: P) => {
      const key = getCacheKey(fetchParams);
      const cached = globalCache.get(key);

      if (
        cached &&
        isValidCache(cached) &&
        cached.params === JSON.stringify(fetchParams)
      ) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);

        globalCache.set(key, {
          data: result,
          timestamp: Date.now(),
          params: JSON.stringify(fetchParams),
        });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn, getCacheKey, isValidCache],
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams: P) => await fetchData(newParams);

  return { data, loading, error, refetch, invalidateCache };
};
