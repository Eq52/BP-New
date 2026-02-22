import type { PlayHistory, PlayerSettings, CacheSettings } from '@/types';

const HISTORY_KEY = 'bismuth_play_history';
const PLAYER_SETTINGS_KEY = 'bismuth_player_settings';
const CACHE_SETTINGS_KEY = 'bismuth_cache_settings';
const CORS_PROXY_KEY = 'bismuth_cors_proxy';

// 播放历史
export function getPlayHistory(): PlayHistory[] {
  const stored = localStorage.getItem(HISTORY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export function addPlayHistory(history: PlayHistory): void {
  const histories = getPlayHistory();
  const existingIndex = histories.findIndex(h => h.vod_id === history.vod_id);
  
  if (existingIndex >= 0) {
    // 更新已有记录
    histories[existingIndex] = history;
  } else {
    // 添加新记录
    histories.unshift(history);
  }
  
  // 只保留最近100条
  const trimmed = histories.slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function removePlayHistory(vodId: number): void {
  const histories = getPlayHistory().filter(h => h.vod_id !== vodId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(histories));
}

export function clearPlayHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// 默认播放器地址
const DEFAULT_PLAYER_URL = 'https://ericq521.web.app/ckplayer/?v=';

// 播放器设置
export function getPlayerSettings(): PlayerSettings {
  const stored = localStorage.getItem(PLAYER_SETTINGS_KEY);
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      // 如果保存的设置为未设置，则使用默认播放器
      if (!settings.playerUrl) {
        settings.playerUrl = DEFAULT_PLAYER_URL;
      }
      return settings;
    } catch {
      return { playerUrl: DEFAULT_PLAYER_URL, autoResume: true };
    }
  }
  return { playerUrl: DEFAULT_PLAYER_URL, autoResume: true };
}

export function savePlayerSettings(settings: PlayerSettings): void {
  localStorage.setItem(PLAYER_SETTINGS_KEY, JSON.stringify(settings));
}

// 缓存设置
export function getCacheSettings(): CacheSettings {
  const stored = localStorage.getItem(CACHE_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { enabled: true };
    }
  }
  return { enabled: true };
}

export function saveCacheSettings(settings: CacheSettings): void {
  localStorage.setItem(CACHE_SETTINGS_KEY, JSON.stringify(settings));
}

// CORS代理
export function getCorsProxy(): string {
  return localStorage.getItem(CORS_PROXY_KEY) || '';
}

export function setCorsProxy(proxy: string): void {
  localStorage.setItem(CORS_PROXY_KEY, proxy);
}

// 获取缓存大小
export async function getCacheSize(): Promise<string> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      return formatBytes(usage);
    } catch {
      return '未知';
    }
  }
  return '不支持';
}

// 清除缓存
export async function clearCache(): Promise<void> {
  // 清除Service Worker缓存
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
