'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/components/LoginForm';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { TaskCard } from '@/components/TaskCard';
import { TTTaskRow } from '@/components/TTTaskRow';
import { TaskFilters } from '@/components/TaskFilters';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import { Task, TTTask, TaskFilters as TaskFiltersType } from '@/lib/types';
import { MessageCircle } from 'lucide-react';

function TaskDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tasks, setTasks] = useState<(Task | TTTask)[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<(Task | TTTask)[]>([]);
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [taskCounts, setTaskCounts] = useState<{ DC: number; TT: number }>({ DC: 0, TT: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current section from URL params, default to TT
  const currentSection = (searchParams.get('section') as 'DC' | 'TT' | 'management') || 'TT';

  useEffect(() => {
    if (user && token) {
      console.log('[Dashboard] User authenticated, fetching tasks for section:', currentSection);
      // Clear filters when switching sections since they have different filter types
      setFilters({});
      if (currentSection !== 'management') {
        fetchTasks();
      }
    }
  }, [user, token, currentSection]);

  useEffect(() => {
    console.log('[Dashboard] Applying filters to', tasks.length, 'tasks');
    applyFilters();
  }, [tasks, filters]);

  useEffect(() => {
    if (user && token && currentSection !== 'management') {
      console.log('[Dashboard] Filters changed, refetching tasks');
      fetchTasks();
    }
  }, [filters]);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[Dashboard] Fetching', currentSection, 'tasks with filters:', filters);
      
      const queryParams = new URLSearchParams();
      
      // Remove category from filters since we use sections now
      if (filters.location && filters.location !== 'all') {
        queryParams.append('location', filters.location);
      }
      if (filters.priority && filters.priority !== 'all') {
        queryParams.append('priority', filters.priority);
      }
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.type && filters.type !== 'all') {
        queryParams.append('type', filters.type);
      }
      if (filters.search && filters.search.trim()) {
        queryParams.append('search', filters.search.trim());
      }

      // TT-specific filters
      if (currentSection === 'TT') {
        if (filters.category && filters.category !== 'all') {
          queryParams.append('category', filters.category);
        }
        if (filters.lighting && filters.lighting !== 'all') {
          queryParams.append('lighting', filters.lighting);
        }
        if (filters.scenario && filters.scenario !== 'all') {
          queryParams.append('scenario', filters.scenario);
        }
      }

      // Use different API endpoints based on current section
      const baseUrl = currentSection === 'TT' ? '/api/tasks/tt' : '/api/tasks';
      const url = `${baseUrl}?${queryParams.toString()}`;
      console.log('[Dashboard] Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[Dashboard] API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Dashboard] API response data:', data);

      if (data.success) {
        setTasks(data.data);
        console.log('[Dashboard] Successfully loaded', data.data.length, currentSection, 'tasks');
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (error: any) {
      console.error('[Dashboard] Failed to fetch tasks:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // All filtering is now handled server-side, so just use the tasks from API
    setFilteredTasks(tasks);
    console.log('[Dashboard] Applied filters, showing', tasks.length, 'tasks');
  };

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    console.log('[Dashboard] Filters changed:', newFilters);
    setFilters(newFilters);
  };

  const clearFilters = () => {
    console.log('[Dashboard] Clearing filters');
    setFilters({});
  };

  const refreshTasks = () => {
    if (currentSection !== 'management') {
      fetchTasks();
    }
    fetchTaskCounts();
  };

  const fetchTaskCounts = async () => {
    if (!user || !token) return;
    
    try {
      const [dcResponse, ttResponse] = await Promise.all([
        fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/tasks/tt', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      const dcData = dcResponse.ok ? await dcResponse.json() : { success: false, data: [] };
      const ttData = ttResponse.ok ? await ttResponse.json() : { success: false, data: [] };

      setTaskCounts({
        DC: dcData.success ? dcData.data.length : 0,
        TT: ttData.success ? ttData.data.length : 0
      });
    } catch (error) {
      console.error('[Dashboard] Failed to fetch task counts:', error);
      setTaskCounts({ DC: 0, TT: 0 });
    }
  };

  const handleSectionChange = (section: 'DC' | 'TT' | 'management') => {
    console.log('[Dashboard] Section changed to:', section);
    router.push(`/?section=${section}`);
  };

  const handleTaskClick = (task: Task | TTTask) => {
    if (task.category === 'TT') {
      router.push(`/tasks/${task.id}`);
    }
    // For DC tasks, we could implement a similar page later
  };

  useEffect(() => {
    if (user && token) {
      console.log('[Dashboard] User authenticated, fetching task counts');
      fetchTaskCounts();
    }
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (currentSection === 'management') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onMenuToggle={() => setIsSidebarOpen(true)}
          onDashboardToggle={() => handleSectionChange('TT')}
        />
        <Dashboard 
          onBackToTasks={() => handleSectionChange('TT')} 
          onRefreshTasks={refreshTasks}
        />
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentSection={currentSection} 
          onSectionChange={handleSectionChange}
          taskCounts={taskCounts}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setIsSidebarOpen(true)}
        onDashboardToggle={() => handleSectionChange('management')}
      />
      
      <TaskFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={clearFilters}
        activeTab={currentSection}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {currentSection === 'DC' ? 'Data Collection Tasks' : 'Test Track Tasks'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} available
            {(() => {
              if (filteredTasks.length === 0) return '';
              const taskLocations = [...new Set(filteredTasks.map(task => task.location))];
              if (taskLocations.length === 1) {
                return ` in ${taskLocations[0]}`;
              } else if (taskLocations.length > 1) {
                return ` across ${taskLocations.join(', ')}`;
              }
              return '';
            })()}
          </p>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">Error: {error}</p>
              <button 
                onClick={fetchTasks}
                className="text-red-700 underline text-sm mt-2 touch-manipulation"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-500 text-lg mb-2">No tasks found</div>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {Object.keys(filters).some(key => filters[key as keyof TaskFiltersType] && filters[key as keyof TaskFiltersType] !== 'all')
                ? 'Try adjusting your filters to see more tasks.'
                : 'No tasks are currently available.'}
            </p>
            {!error && (
              <button 
                onClick={fetchTasks}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 touch-manipulation"
              >
                Refresh Tasks
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredTasks.map((task) => {
              // Use different components based on task type
              if (task.category === 'TT') {
                return (
                  <TTTaskRow 
                    key={task.id} 
                    task={task as TTTask}
                    onClick={() => handleTaskClick(task)}
                  />
                );
              } else {
                return (
                  <TaskCard 
                    key={task.id} 
                    task={task as Task} 
                    onTaskUpdated={refreshTasks}
                  />
                );
              }
            })}
          </div>
        )}
      </main>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentSection={currentSection} 
        onSectionChange={handleSectionChange}
        taskCounts={taskCounts}
      />

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-110 touch-manipulation"
            title="Open AI Assistant"
            aria-label="Open AI Assistant"
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
      </div>

      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <TaskDashboard />
      </Suspense>
    </AuthProvider>
  );
}
