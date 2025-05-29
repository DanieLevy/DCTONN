'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
import { QRScanner } from '@/components/QRScanner';
import { VehicleDataModal } from '@/components/VehicleDataModal';
import { ClientOnlyHandler } from '@/components/ClientOnlyHandler';
import { Task, TTTask, TaskFilters as TaskFiltersType } from '@/lib/types';
import { VehicleData, isValidVehicleData } from '@/lib/vehicle-types';
import { decodeCompressedJson, isBase64, isURL, safeDecodeCompressedJson } from '@/utils/decodeCompressedJson';
import { MessageCircle, QrCode, FileText } from 'lucide-react';

// Enhanced Error Boundary for handling simulator and DOM conflicts
class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: string }
> {
  private retryCount = 0;
  private maxRetries = 2;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if this is a DOM manipulation error (common with simulators)
    const isDOMError = error.message.includes('removeChild') || 
                      error.message.includes('Hydration') ||
                      error.name === 'NotFoundError';
    
    return { 
      hasError: true, 
      error,
      errorInfo: isDOMError ? 'dom-conflict' : 'general'
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Error Boundary] Caught error:', error.message);
      
      // Check if this is a DOM manipulation error
      if (error.message.includes('removeChild') || error.message.includes('Hydration')) {
        console.warn('[Error Boundary] DOM conflict detected - likely mobile simulator issue');
      }
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      
      // Clear any problematic DOM attributes before retrying
      setTimeout(() => {
        try {
          const body = document.body;
          const html = document.documentElement;
          
          ['data-js', 'data-simulator', 'class'].forEach(attr => {
            if (body.hasAttribute(attr)) {
              const value = body.getAttribute(attr);
              if (value?.includes('simulator')) {
                body.removeAttribute(attr);
              }
            }
            if (html.hasAttribute(attr)) {
              const value = html.getAttribute(attr);
              if (value?.includes('simulator')) {
                html.removeAttribute(attr);
              }
            }
          });
        } catch (e) {
          console.warn('[Error Boundary] Could not clean DOM:', e);
        }
      }, 100);
    } else {
      // Max retries reached, force reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDOMError = this.state.errorInfo === 'dom-conflict';
      
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isDOMError ? 'Display Issue Detected' : 'Something went wrong'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isDOMError 
                ? 'This appears to be a mobile simulator compatibility issue. Try refreshing or switching to a real device.'
                : 'Please refresh the page to try again.'
              }
            </p>
            <div className="space-y-3">
              {this.retryCount < this.maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              ) : null}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="text-xs text-gray-400 mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  // Vehicle data modal states
  const [isVehicleDataModalOpen, setIsVehicleDataModalOpen] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [rawQRContent, setRawQRContent] = useState<string | null>(null);

  // Get current section from URL params, default to TT
  const currentSection = (searchParams.get('section') as 'DC' | 'TT' | 'management') || 'TT';

  // Handle client-side mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handleQRScanResult = async (result: string) => {
    console.log('[QR Scanner] Scan result:', result);
    setQrScanResult(result);
    setIsQRScannerOpen(false);
    setRawQRContent(result);
    
    let parsedData: any = null;
    let processingMethod = '';
    
    try {
      // Check what type of input we have
      if (isURL(result.trim())) {
        console.log('[QR Scanner] URL detected, fetching and decoding...');
        processingMethod = 'URL + Base64 + JSON';
        parsedData = await decodeCompressedJson(result.trim());
      } else if (isBase64(result.trim())) {
        console.log('[QR Scanner] Base64 detected, attempting to decode...');
        processingMethod = 'Base64 + JSON';
        parsedData = await decodeCompressedJson(result.trim());
      } else {
        // Try direct JSON parsing
        console.log('[QR Scanner] Direct JSON parsing...');
        processingMethod = 'Direct JSON';
        parsedData = JSON.parse(result);
      }
      
      console.log('[QR Scanner] Parsed vehicle data via', processingMethod, ':', parsedData);
      
      // Validate using the type guard function
      if (isValidVehicleData(parsedData)) {
        console.log('[QR Scanner] Valid vehicle data structure detected');
        setVehicleData(parsedData);
        setIsVehicleDataModalOpen(true);
      } else {
        console.warn('[QR Scanner] Invalid vehicle data structure');
        alert(`QR Code Processed!\n\nMethod: ${processingMethod}\n\nThe data was decoded successfully but does not match the expected vehicle data format.\n\nRaw content: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
      }
    } catch (error) {
      console.warn('[QR Scanner] All parsing methods failed:', error);
      
      // Provide more detailed error information
      let errorMessage = `QR Code Scanned!\n\nProcessing failed with method: ${processingMethod}\n\n`;
      
      if (isURL(result.trim())) {
        errorMessage += 'URL detected but fetching/decoding failed.\n\n';
      } else if (isBase64(result.trim())) {
        errorMessage += 'Base64 format detected but decoding failed.\n\n';
      } else {
        errorMessage += 'Direct JSON parsing failed.\n\n';
      }
      
      errorMessage += `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
      errorMessage += `Raw content: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`;
      
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (user && token) {
      console.log('[Dashboard] User authenticated, fetching task counts');
      fetchTaskCounts();
    }
  }, [user, token]);

  if (loading || !isClient) {
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
      
      <main className="py-6">
        <div className="container mx-auto px-4 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
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
            </div>
            
            {/* QR Scanner Button - Only show for TT tasks */}
            {currentSection === 'TT' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsQRScannerOpen(true)}
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 touch-manipulation text-sm font-medium shadow-sm hover:shadow-md flex-shrink-0"
                  title="Scan QR Code"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan QR Code</span>
                  <span className="sm:hidden">Scan</span>
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">Error: {error}</p>
              <button 
                onClick={fetchTasks}
                className="text-red-700 underline text-sm mt-2 touch-manipulation font-medium"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600">Loading tasks...</span>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="container mx-auto px-4">
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
          </div>
        ) : (
          <div className="pb-4">
            {filteredTasks.map((task, index) => {
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
                  <div key={task.id} className="mx-4 mb-4">
                    <TaskCard 
                      task={task as Task} 
                      onTaskUpdated={refreshTasks}
                    />
                  </div>
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

      {/* QR Code Scanner */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanResult={handleQRScanResult}
      />

      {/* Vehicle Data Modal */}
      <VehicleDataModal
        isOpen={isVehicleDataModalOpen}
        onClose={() => {
          setIsVehicleDataModalOpen(false);
          setVehicleData(null);
          setRawQRContent(null);
        }}
        data={vehicleData}
        rawQRContent={rawQRContent}
      />
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Simple mounting check without complex DOM manipulation
    setMounted(true);
  }, []);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SimpleErrorBoundary>
      <ClientOnlyHandler />
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <TaskDashboard />
        </Suspense>
      </AuthProvider>
    </SimpleErrorBoundary>
  );
}
