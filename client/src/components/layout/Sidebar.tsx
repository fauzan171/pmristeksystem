import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  GanttChart,
  Bell,
  Activity,
  Settings,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi } from '../../api/whatsapp.api';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/timeline', label: 'Timeline', icon: GanttChart },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { data: waStatus } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => whatsappApi.getStatus(),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[240px] bg-white border-r border-warm-400 flex flex-col transition-transform duration-300 md:translate-x-0 md:static md:z-auto md:w-[64px] lg:w-[240px] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-warm-400">
          <h1 className="text-xl font-bold">
            <span className="text-coral">R</span>
            <span className="hidden lg:inline">PMS</span>
          </h1>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-warm-100 text-text-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-coral-light text-coral border-l-[3px] border-coral'
                    : 'text-text-secondary hover:bg-warm-100 hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: WA Status + User */}
        <div className="border-t border-warm-400 p-4 space-y-3">
          <button
            onClick={() => { navigate('/settings'); onClose(); }}
            className="flex items-center gap-2 text-xs w-full hover:bg-warm-100 rounded-lg p-2 -m-2 transition-colors"
          >
            {waStatus?.connected ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" />
                <Wifi className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-success font-medium hidden lg:inline">Connected</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-danger flex-shrink-0" />
                <WifiOff className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <span className="text-text-tertiary font-medium hidden lg:inline">Disconnected</span>
              </>
            )}
          </button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-white text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 hidden lg:block">
                <p className="text-xs font-medium text-text-primary truncate">{user.name}</p>
                <p className="text-[10px] text-text-tertiary truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
