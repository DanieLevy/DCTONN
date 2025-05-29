'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Lightbulb,
  TrendingUp,
  MapPin,
  Car,
  BellRing
} from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface SmartNotification {
  id: string;
  type: 'urgent' | 'info' | 'success' | 'warning' | 'insight';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'task' | 'performance' | 'system' | 'recommendation';
  metadata?: Record<string, any>;
}

interface SmartNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartNotifications({ isOpen, onClose }: SmartNotificationsProps) {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token && user) {
      generateSmartNotifications();
      // Check for new notifications every 5 minutes
      const interval = setInterval(generateSmartNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const generateSmartNotifications = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Generate AI-powered notifications based on current context
      const newNotifications = await fetchSmartNotifications();
      setNotifications(prev => {
        // Merge new notifications with existing ones, avoiding duplicates
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...uniqueNew].slice(-20); // Keep only last 20 notifications
      });
    } catch (error) {
      console.error('[Smart Notifications] Error generating notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmartNotifications = async (): Promise<SmartNotification[]> => {
    const notifications: SmartNotification[] = [];
    const now = new Date();

    try {
      // Fetch current task status for AI analysis
      const tasksResponse = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const ttTasksResponse = await fetch('/api/tasks/tt', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (tasksResponse.ok && ttTasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        const ttTasksData = await ttTasksResponse.json();
        
        if (tasksData.success && ttTasksData.success) {
          const dcTasks = tasksData.data || [];
          const ttTasks = ttTasksData.data || [];

          // High priority task notifications
          const highPriorityTasks = dcTasks.filter((task: any) => 
            task.priority === 'high' && task.status === 'active'
          );
          
          if (highPriorityTasks.length > 0) {
            notifications.push({
              id: `high-priority-${Date.now()}`,
              type: 'urgent',
              title: `${highPriorityTasks.length} High Priority Tasks`,
              message: `You have ${highPriorityTasks.length} high priority tasks requiring attention. Consider prioritizing these for execution.`,
              timestamp: now,
              read: false,
              priority: 'high',
              category: 'task',
              action: {
                label: 'View Tasks',
                onClick: () => {
                  window.location.href = '/?section=DC&priority=high';
                  onClose();
                }
              },
              metadata: { taskCount: highPriorityTasks.length, taskIds: highPriorityTasks.map((t: any) => t.id) }
            });
          }

          // TT task completion insights
          const totalSubtasks = ttTasks.reduce((sum: number, tt: any) => 
            sum + (tt.subtasks?.length || 0), 0
          );
          const completedSubtasks = ttTasks.reduce((sum: number, tt: any) => 
            sum + (tt.subtasks?.filter((st: any) => st.isExecuted || st.status === 'completed').length || 0), 0
          );
          
          if (totalSubtasks > 0) {
            const completionRate = (completedSubtasks / totalSubtasks) * 100;
            
            if (completionRate < 30) {
              notifications.push({
                id: `low-completion-${Date.now()}`,
                type: 'warning',
                title: 'Low TT Task Completion Rate',
                message: `Current completion rate is ${completionRate.toFixed(1)}%. Consider focusing on TT task execution to improve project velocity.`,
                timestamp: now,
                read: false,
                priority: 'medium',
                category: 'performance',
                action: {
                  label: 'View TT Tasks',
                  onClick: () => {
                    window.location.href = '/?section=TT';
                    onClose();
                  }
                },
                metadata: { completionRate, totalSubtasks, completedSubtasks }
              });
            } else if (completionRate > 80) {
              notifications.push({
                id: `high-completion-${Date.now()}`,
                type: 'success',
                title: 'Excellent Progress!',
                message: `Outstanding! You've achieved ${completionRate.toFixed(1)}% completion rate on TT tasks. Keep up the great work!`,
                timestamp: now,
                read: false,
                priority: 'low',
                category: 'performance',
                metadata: { completionRate }
              });
            }
          }

          // Location-based workload insights
          const locationCounts = dcTasks.reduce((acc: Record<string, number>, task: any) => {
            acc[task.location] = (acc[task.location] || 0) + 1;
            return acc;
          }, {});

          const userLocation = user?.location;
          if (userLocation && locationCounts[userLocation] > 5) {
            notifications.push({
              id: `location-workload-${Date.now()}`,
              type: 'info',
              title: 'High Workload in Your Location',
              message: `There are ${locationCounts[userLocation]} tasks in ${userLocation}. Consider coordinating with your team for efficient execution.`,
              timestamp: now,
              read: false,
              priority: 'medium',
              category: 'recommendation',
              metadata: { location: userLocation, taskCount: locationCounts[userLocation] }
            });
          }

          // Weather-sensitive task recommendations
          const weatherTasks = dcTasks.filter((task: any) => 
            task.weather && task.weather !== 'clear' && task.status === 'active'
          );
          
          if (weatherTasks.length > 0) {
            notifications.push({
              id: `weather-tasks-${Date.now()}`,
              type: 'insight',
              title: 'Weather-Dependent Tasks Available',
              message: `${weatherTasks.length} tasks require specific weather conditions. Plan execution accordingly.`,
              timestamp: now,
              read: false,
              priority: 'medium',
              category: 'recommendation',
              metadata: { weatherTaskCount: weatherTasks.length }
            });
          }

          // Vehicle utilization insights
          const vehicleGroups = dcTasks.reduce((acc: Record<string, number>, task: any) => {
            const vehicle = task.targetCar || 'Unassigned';
            acc[vehicle] = (acc[vehicle] || 0) + 1;
            return acc;
          }, {});

          const mostUsedVehicle = Object.entries(vehicleGroups)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] as [string, number] | undefined;

          if (mostUsedVehicle && mostUsedVehicle[1] > 3) {
            notifications.push({
              id: `vehicle-utilization-${Date.now()}`,
              type: 'insight',
              title: 'Vehicle Utilization Insight',
              message: `${mostUsedVehicle[0]} has ${mostUsedVehicle[1]} assigned tasks. Consider batch execution for efficiency.`,
              timestamp: now,
              read: false,
              priority: 'low',
              category: 'recommendation',
              metadata: { vehicle: mostUsedVehicle[0], taskCount: mostUsedVehicle[1] }
            });
          }
        }
      }
    } catch (error) {
      console.error('[Smart Notifications] Error fetching task data:', error);
    }

    // AI Status notification
    try {
      const aiStatusResponse = await fetch('/api/ai/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (aiStatusResponse.ok) {
        const aiData = await aiStatusResponse.json();
        if (aiData.success && !aiData.data.lmStudio.connected) {
          notifications.push({
            id: `ai-offline-${Date.now()}`,
            type: 'warning',
            title: 'AI Assistant Limited',
            message: 'LM Studio is not connected. AI features are running in fallback mode with reduced capabilities.',
            timestamp: now,
            read: false,
            priority: 'low',
            category: 'system',
            metadata: { aiStatus: 'fallback' }
          });
        }
      }
    } catch (error) {
      console.error('[Smart Notifications] Error checking AI status:', error);
    }

    return notifications;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'info': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'insight': return <Lightbulb className="h-5 w-5 text-purple-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'warning': return 'border-l-orange-500 bg-orange-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      case 'insight': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BellRing className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Smart Notifications</h3>
                <p className="text-sm text-blue-100">AI-powered insights & alerts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="mt-2 text-sm text-blue-100 hover:text-white underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No notifications yet</p>
              <p className="text-sm">AI insights will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 p-4 transition-all duration-200 ${getNotificationBg(notification.type)} ${
                      !notification.read ? 'border-l-4' : 'border-l-2 opacity-75'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-800' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                          {notification.action && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                notification.action!.onClick();
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 