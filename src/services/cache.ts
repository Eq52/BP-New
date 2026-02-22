// API缓存管理
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

  // 获取缓存
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  // 删除缓存
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存统计
  getStats(): { count: number; size: string } {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += JSON.stringify(entry).length * 2; // 粗略估计
    });

    return {
      count: this.cache.size,
      size: this.formatBytes(totalSize),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 全局缓存实例
const apiCache = new ApiCache();

export function getApiCache() {
  return apiCache;
}

export function getCacheStats() {
  return apiCache.getStats();
}

export function clearApiCache() {
  apiCache.clear();
}

// 带缓存的fetch
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  apiCache.set(key, data, ttl);
  return data;
}
