import type { VideoSource, VideoItem, ApiResponse } from '@/types';
import { getCacheSettings } from '@/services/storage';
import { fetchWithCache } from '@/services/cache';

const STORAGE_KEY = 'bismuth_sources';
const CURRENT_SOURCE_KEY = 'current_source_id';
const CORS_PROXY_KEY = 'bismuth_cors_proxy';

// 默认CORS代理列表
const DEFAULT_CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

// 获取CORS代理
export function getCorsProxy(): string {
  return localStorage.getItem(CORS_PROXY_KEY) || DEFAULT_CORS_PROXIES[0];
}

// 设置CORS代理
export function setCorsProxy(proxy: string): void {
  localStorage.setItem(CORS_PROXY_KEY, proxy);
}

// 获取所有影视源
export function getSources(): VideoSource[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// 添加影视源
export function addSource(source: VideoSource): void {
  const sources = getSources();
  if (sources.find(s => s.id === source.id)) {
    throw new Error('影视源ID已存在');
  }
  sources.push(source);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

// 删除影视源
export function removeSource(sourceId: string): void {
  const sources = getSources().filter(s => s.id !== sourceId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
}

// 获取当前影视源
export function getCurrentSource(): VideoSource | null {
  const sources = getSources();
  const currentId = localStorage.getItem(CURRENT_SOURCE_KEY);
  if (currentId) {
    return sources.find(s => s.id === currentId) || sources[0] || null;
  }
  return sources[0] || null;
}

// 设置当前影视源
export function setCurrentSource(sourceId: string): void {
  localStorage.setItem(CURRENT_SOURCE_KEY, sourceId);
}

// 测试影视源
export async function testSource(url: string): Promise<boolean> {
  try {
    const corsProxy = getCorsProxy();
    const response = await fetch(`${corsProxy}${encodeURIComponent(url)}?ac=list&pg=1`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.code === 1 && Array.isArray(data.list);
  } catch {
    return false;
  }
}

// 构建API URL
function buildApiUrl(endpoint: string, params: Record<string, string> = {}): string {
  const source = getCurrentSource();
  if (!source) throw new Error('未选择影视源');
  
  const url = new URL(endpoint, source.url);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const corsProxy = getCorsProxy();
  return `${corsProxy}${encodeURIComponent(url.toString())}`;
}

// 获取影视列表
export async function getVideoList(
  page: number = 1,
  limit: number = 18,
  category: string = 'all'
): Promise<ApiResponse> {
  const params: Record<string, string> = {
    ac: 'list',
    pg: page.toString(),
    limit: limit.toString(),
  };
  
  if (category && category !== 'all') {
    params.t = category;
  }
  
  const cacheKey = `videoList_${page}_${limit}_${category}`;
  const cacheSettings = getCacheSettings();
  
  const fetcher = async () => {
    const response = await fetch(buildApiUrl('', params));
    if (!response.ok) throw new Error('获取影视列表失败');
    return response.json();
  };
  
  const data = cacheSettings.enabled 
    ? await fetchWithCache(cacheKey, fetcher, 2 * 60 * 1000) // 2分钟缓存
    : await fetcher();
  
  return {
    ...data,
    list: data.list || [],
  };
}

// 获取影视详情
export async function getVideoDetail(vodId: number): Promise<VideoItem | null> {
  const cacheKey = `videoDetail_${vodId}`;
  const cacheSettings = getCacheSettings();
  
  const fetcher = async () => {
    const response = await fetch(buildApiUrl('', {
      ac: 'detail',
      ids: vodId.toString(),
    }));
    if (!response.ok) throw new Error('获取影视详情失败');
    return response.json();
  };
  
  const data = cacheSettings.enabled 
    ? await fetchWithCache(cacheKey, fetcher, 5 * 60 * 1000) // 5分钟缓存
    : await fetcher();
  
  if (data.list && data.list.length > 0) {
    return data.list[0];
  }
  return null;
}

// 搜索影视
export async function searchVideos(wd: string): Promise<ApiResponse> {
  const cacheKey = `search_${wd}`;
  const cacheSettings = getCacheSettings();
  
  const fetcher = async () => {
    const response = await fetch(buildApiUrl('', {
      ac: 'list',
      wd: wd,
      limit: '50',
    }));
    if (!response.ok) throw new Error('搜索影视失败');
    return response.json();
  };
  
  const data = cacheSettings.enabled 
    ? await fetchWithCache(cacheKey, fetcher, 3 * 60 * 1000) // 3分钟缓存
    : await fetcher();
  
  return {
    ...data,
    list: data.list || [],
  };
}

// 获取分类列表
export async function getCategories(): Promise<{ id: string; name: string }[]> {
  const cacheKey = 'categories';
  const cacheSettings = getCacheSettings();
  
  const fetcher = async () => {
    const response = await fetch(buildApiUrl('', { ac: 'list' }));
    if (!response.ok) throw new Error('获取分类失败');
    return response.json();
  };
  
  try {
    const data = cacheSettings.enabled 
      ? await fetchWithCache(cacheKey, fetcher, 10 * 60 * 1000) // 10分钟缓存
      : await fetcher();
    
    const categories = [{ id: 'all', name: '全部' }];
    
    if (data.class) {
      data.class.forEach((cat: { type_id: number; type_name: string }) => {
        categories.push({
          id: cat.type_id.toString(),
          name: cat.type_name,
        });
      });
    }
    
    return categories;
  } catch {
    return [{ id: 'all', name: '全部' }];
  }
}

// 解析播放地址
export function parsePlayUrls(
  vodPlayUrl: string = '',
  _vodPlayFrom: string = ''
): { name: string; url: string }[] {
  if (!vodPlayUrl) return [];
  
  const episodes: { name: string; url: string }[] = [];
  
  // 处理多种格式
  // 格式1: 第1集$http://...#第2集$http://...
  // 格式2: http://...$$$http://...
  
  const lines = vodPlayUrl.split('#');
  
  for (const line of lines) {
    const parts = line.split('$');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const url = parts[1].trim();
      if (name && url) {
        episodes.push({ name, url });
      }
    } else if (parts.length === 1 && parts[0].startsWith('http')) {
      // 只有URL，使用序号作为名称
      episodes.push({
        name: `第${episodes.length + 1}集`,
        url: parts[0].trim(),
      });
    }
  }
  
  return episodes;
}
