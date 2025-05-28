'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  Settings, 
  Users, 
  BarChart3,
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Database,
  TestTube,
  X
} from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: 'DC' | 'TT' | 'management';
  onSectionChange: (section: 'DC' | 'TT' | 'management') => void;
  taskCounts: { DC: number; TT: number };
}

export function Sidebar({ isOpen, onClose, currentSection, onSectionChange, taskCounts }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleSectionChange = (section: 'DC' | 'TT' | 'management') => {
    onSectionChange(section);
    onClose(); // Close sidebar after selection
  };

  const canAccessManagement = user && (user.role === 'admin' || user.role === 'data_manager');

  const menuItems = [
    {
      id: 'DC' as const,
      label: 'Data Collection',
      icon: Database,
      count: taskCounts.DC,
      description: 'Manage DC tasks'
    },
    {
      id: 'TT' as const,
      label: 'Test Track',
      icon: TestTube,
      count: taskCounts.TT,
      description: 'Manage TT tasks'
    }
  ];

  const managementItems = canAccessManagement ? [
    {
      id: 'management' as const,
      label: 'Management',
      icon: Settings,
      description: 'System management'
    }
  ] : [];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">DCTON</h2>
                <p className="text-xs text-gray-500">Task Management</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role} • {user?.location}
                </p>
                {user?.permissions && user.permissions.length > 1 && (
                  <p className="text-xs text-blue-600 truncate">
                    Access: {user.permissions.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Tasks
              </p>
            )}
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {item.count > 0 && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          isActive 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Management Section */}
          {managementItems.length > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              {!isCollapsed && (
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  System
                </p>
              )}
              
              {managementItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50 ${
              isCollapsed ? 'px-2' : 'justify-start'
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
}