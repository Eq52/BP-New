import { Home, Search, History, Settings, Film, Github } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface ResponsiveNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function ResponsiveNav({ currentPage, onPageChange }: ResponsiveNavProps) {
  const isDesktop = useIsDesktop();
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'search', label: '搜索', icon: Search },
    { id: 'history', label: '历史', icon: History },
    { id: 'settings', label: '设置', icon: Settings },
  ];

  // 桌面端侧边导航
  if (isDesktop) {
    return (
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0a0a] border-r border-white/5 z-50 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-purple-500/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight">Bismuth</h1>
            <p className="text-gray-500 text-xs">如"秘"般美丽</p>
          </div>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 px-4 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/5'}`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-gray-600 text-xs">Bismuth Player V3.0</p>
          <a 
            href="https://github.com/Eq52/Bismuth-Player" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-gray-500 hover:text-white text-xs mt-2 transition-colors"
          >
            <Github size={14} className="mr-1.5" />
            GitHub
          </a>
        </div>
      </aside>
    );
  }

  // 移动端底部导航
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
