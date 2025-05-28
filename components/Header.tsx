'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { 
  Settings, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Menu,
  User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeaderProps {
  onMenuToggle?: () => void;
  onDashboardToggle?: () => void;
  title?: string;
}

export function Header({ onMenuToggle, onDashboardToggle, title }: HeaderProps) {
  const { user, logout, token } = useAuth();
  const [aiStatus, setAiStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error?: string;
  }>({ connected: false, loading: true });

  useEffect(() => {
    if (user && token) {
      checkAIStatus();
    }
  }, [user, token]);

  const checkAIStatus = async () => {
    try {
      setAiStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/ai/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiStatus({
            connected: data.data.lmStudio.connected,
            loading: false,
            error: data.data.lmStudio.error,
          });
        }
      }
    } catch (error) {
      setAiStatus({
        connected: false,
        loading: false,
        error: 'Failed to check AI status',
      });
    }
  };

  const handleDashboardClick = () => {
    if (onDashboardToggle) {
      onDashboardToggle();
    }
  };

  const getLocationBadgeColor = (location: string) => {
    switch (location) {
      case 'EU': return 'bg-blue-100 text-blue-800';
      case 'USA': return 'bg-green-100 text-green-800';
      case 'IL': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Menu Toggle Button */}
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Logo/Title */}
          {title ? (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          ) : (
            <Image 
              src="/mobileye-logo-square.svg" 
              alt="Mobileye" 
              width={120} 
              height={24}
              className="h-6 w-auto"
            />
          )}

          {/* AI Status Indicator */}
          {user && (
            <div className="hidden sm:flex items-center space-x-1">
              {aiStatus.loading ? (
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              ) : aiStatus.connected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-xs text-gray-600">
                {aiStatus.loading ? 'AI' : aiStatus.connected ? 'LM Studio' : 'Fallback'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user && (
            <>
              {/* Dashboard/Admin Button */}
              {(user.role === 'admin' || user.role === 'data_manager') && onDashboardToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2"
                  onClick={handleDashboardClick}
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                  </span>
                </Button>
              )}

              {/* User Info - Condensed */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="hidden sm:inline text-gray-600">{user.username}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLocationBadgeColor(user.location)}`}>
                    {user.location}
                  </span>
                  {user.permissions && user.permissions.length > 1 && (
                    <span className="hidden lg:inline px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Multi-Region
                    </span>
                  )}
                </div>
                
                <Button variant="ghost" size="sm" onClick={logout} className="p-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline ml-1">Logout</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 