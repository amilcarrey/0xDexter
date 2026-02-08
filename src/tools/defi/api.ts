import { getTurtleApiBaseUrl } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

export interface ApiResponse {
  data: Record<string, unknown>;
  url: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Default TTLs in milliseconds
const TTL = {
  opportunities: 60_000,
  opportunity: 30_000,
  route: 0,
  membership: 300_000,
  deposits: 120_000,
  actions: 0,
} as const;

function getTtl(endpoint: string): number {
  if (endpoint.startsWith('/route')) return TTL.route;
  if (endpoint.startsWith('/membership')) return TTL.membership;
  if (endpoint.startsWith('/deposit')) return TTL.deposits;
  if (endpoint.startsWith('/actions')) return TTL.actions;
  if (endpoint.match(/^\/opportunities\/[^/]+$/)) return TTL.opportunity;
  return TTL.opportunities;
}

export async function callTurtleApi(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  options?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<ApiResponse> {
  const method = options?.method || 'GET';
  const baseUrl = getTurtleApiBaseUrl();
  const url = new URL(`${baseUrl}${endpoint}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  const cacheKey = url.toString();
  const ttl = getTtl(endpoint);

  // Only cache GET requests
  if (method === 'GET' && ttl > 0) {
    const cached = getCached<ApiResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const fetchOptions: RequestInit = { method };
  if (options?.body) {
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), fetchOptions);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Turtle API network error: ${endpoint} — ${message}`);
    throw new Error(`Turtle API request failed for ${endpoint}: ${message}`);
  }

  if (!response.ok) {
    const detail = `${response.status} ${response.statusText}`;
    logger.error(`Turtle API error: ${endpoint} — ${detail}`);
    throw new Error(`Turtle API request failed: ${detail}`);
  }

  const data = await response.json().catch(() => {
    const detail = `invalid JSON (${response.status} ${response.statusText})`;
    logger.error(`Turtle API parse error: ${endpoint} — ${detail}`);
    throw new Error(`Turtle API request failed: ${detail}`);
  });

  const result: ApiResponse = { data, url: url.toString() };

  if (method === 'GET' && ttl > 0) {
    setCache(cacheKey, result, ttl);
  }

  return result;
}
