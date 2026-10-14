"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCaption } from "@/lib/caption";
import type { TrendResponse } from "@/lib/types";

type CaptionCacheEntry = {
  caption: string;
  timestamp: number;
};

type CaptionContextValue = {
  getCaption: (trend: TrendResponse, variable: string) => string | null;
  isLoading: (trend: TrendResponse, variable: string) => boolean;
  getError: (trend: TrendResponse, variable: string) => string | null;
  fetchCaptionForTrend: (trend: TrendResponse, variable: string) => Promise<void>;
};

const CaptionContext = createContext<CaptionContextValue | null>(null);

const STORAGE_KEY = "bluegram:caption-cache";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function loadCacheFromStorage(): Map<string, CaptionCacheEntry> {
  if (typeof window === "undefined") {
    return new Map();
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return new Map();
    }
    const parsed = JSON.parse(stored) as Record<string, CaptionCacheEntry>;
    const now = Date.now();
    const cache = new Map<string, CaptionCacheEntry>();
    for (const [key, value] of Object.entries(parsed)) {
      if (now - value.timestamp < CACHE_EXPIRY_MS) {
        cache.set(key, value);
      }
    }
    return cache;
  } catch (error: unknown) {
    console.error("Failed to load caption cache:", error);
    return new Map();
  }
}

function saveCacheToStorage(cache: Map<string, CaptionCacheEntry>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const obj: Record<string, CaptionCacheEntry> = {};
    for (const [key, value] of cache.entries()) {
      obj[key] = value;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error: unknown) {
    console.error("Failed to save caption cache:", error);
  }
}

export function CaptionProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Map<string, CaptionCacheEntry>>(() => loadCacheFromStorage());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    saveCacheToStorage(cache);
  }, [cache]);

  const getCacheKey = useCallback((trend: TrendResponse, variable: string): string => {
    return `${trend.region.id}:${variable}`;
  }, []);

  const getCaption = useCallback((trend: TrendResponse, variable: string): string | null => {
    const key = getCacheKey(trend, variable);
    const entry = cache.get(key);
    return entry ? entry.caption : null;
  }, [cache, getCacheKey]);

  const isLoading = useCallback((trend: TrendResponse, variable: string): boolean => {
    const key = getCacheKey(trend, variable);
    return loading.has(key);
  }, [loading, getCacheKey]);

  const getError = useCallback((trend: TrendResponse, variable: string): string | null => {
    const key = getCacheKey(trend, variable);
    return errors.get(key) ?? null;
  }, [errors, getCacheKey]);

  const fetchCaptionForTrend = useCallback(async (trend: TrendResponse, variable: string): Promise<void> => {
    const key = getCacheKey(trend, variable);
    
    if (cache.has(key)) {
      return;
    }

    if (loading.has(key)) {
      return;
    }

    setLoading((prev) => new Set(prev).add(key));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });

    try {
      const caption = await fetchCaption(
        {
          regionName: trend.region.name,
          variableLabel: trend.variableLabel,
          direction: trend.direction,
          significance: trend.significance,
          pValue: trend.pValue,
          slopePerDecade: trend.slopePerDecade,
          unit: trend.unit,
          nMonths: trend.nMonths,
        },
        new AbortController().signal
      );

      setCache((prev) => {
        const next = new Map(prev);
        next.set(key, {
          caption,
          timestamp: Date.now(),
        });
        return next;
      });
    } catch (error: unknown) {
      setErrors((prev) => {
        const next = new Map(prev);
        next.set(key, error instanceof Error ? error.message : "Failed to generate caption");
        return next;
      });
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [cache, loading, getCacheKey]);

  const value: CaptionContextValue = {
    getCaption,
    isLoading,
    getError,
    fetchCaptionForTrend,
  };

  return <CaptionContext.Provider value={value}>{children}</CaptionContext.Provider>;
}

export function useCaptionCache(): CaptionContextValue {
  const context = useContext(CaptionContext);
  if (!context) {
    throw new Error("useCaptionCache must be used within CaptionProvider");
  }
  return context;
}
