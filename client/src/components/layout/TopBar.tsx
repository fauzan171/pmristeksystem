import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Dropdown, DropdownItem } from '../ui/Dropdown';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/timeline': 'Timeline',
  '/notifications': 'Notifications',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    if (location.pathname.startsWith('/projects/')) return 'Project Details';
    return pageTitles[location.pathname] || 'RPMS';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-warm-400 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-warm-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-text-secondary hover:bg-warm-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral rounded-full" />
        </button>

        {/* User Dropdown */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer hover:bg-warm-100 rounded-lg px-2 py-1.5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center text-white text-xs font-semibold">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:block text-sm font-medium text-text-primary">
                {user?.name || 'User'}
              </span>
            </div>
          }
        >
          <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => navigate('/settings')}>
            Settings
          </DropdownItem>
          <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={handleLogout} danger>
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
