'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { TTTask } from '@/lib/types';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  FileText,
  Calendar,
  TestTube,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  Edit,
  Check,
  X,
  Play,
  Pause,
  ChevronLeft,
  Grid3X3,
  CalendarDays,
  CalendarRange
} from 'lucide-react';

// Timeline/Calendar Component
interface TimelineCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  view: 'carousel' | 'week' | 'month';
  onViewChange: (view: 'carousel' | 'week' | 'month') => void;
}

function TimelineCalendar({ selectedDate, onDateSelect, view, onViewChange }: TimelineCalendarProps) {
  const today = new Date();
  
  const generateCarouselDays = () => {
    const days = [];
    const baseDate = new Date(selectedDate);
    
    // Generate 7 days before and 7 days after selected date
    for (let i = -7; i <= 7; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const generateMonthDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const startDay = firstDay.getDay();
    
    // Start from previous month's days to fill the first week
    startDate.setDate(firstDay.getDate() - (startDay === 0 ? 6 : startDay - 1));
    
    const days = [];
    const totalCells = 42; // 6 weeks * 7 days
    
    for (let i = 0; i < totalCells; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const formatDate = (date: Date, format: 'day' | 'dayNum' | 'month') => {
    if (format === 'day') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (format === 'dayNum') {
      return date.getDate().toString();
    } else if (format === 'month') {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (view === 'carousel') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    onDateSelect(newDate);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          {view === 'month' && (
            <span className="text-gray-600">{formatDate(selectedDate, 'month')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation */}
          <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDateSelect(today)}
            className="text-blue-600 hover:text-blue-700"
          >
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <Button
              variant={view === 'carousel' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('carousel')}
              className={`h-8 px-3 rounded-md transition-all ${
                view === 'carousel' 
                  ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <CalendarRange className="h-3 w-3 mr-1" />
              Days
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('week')}
              className={`h-8 px-3 rounded-md transition-all ${
                view === 'week' 
                  ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('month')}
              className={`h-8 px-3 rounded-md transition-all ${
                view === 'month' 
                  ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              <Grid3X3 className="h-3 w-3 mr-1" />
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'carousel' && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {generateCarouselDays().map((date, index) => (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                isSelected(date)
                  ? 'border-blue-500 bg-blue-50'
                  : isToday(date)
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-center p-1">
                <div className={`text-xs font-medium ${
                  isSelected(date) ? 'text-blue-700' : isToday(date) ? 'text-orange-700' : 'text-gray-600'
                }`}>
                  {formatDate(date, 'day')}
                </div>
                <div className={`text-lg font-bold ${
                  isSelected(date) ? 'text-blue-900' : isToday(date) ? 'text-orange-900' : 'text-gray-900'
                }`}>
                  {formatDate(date, 'dayNum')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {generateWeekDays().map((date, index) => (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`h-12 rounded-lg border transition-all ${
                isSelected(date)
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : isToday(date)
                  ? 'border-orange-400 bg-orange-50 text-orange-900'
                  : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900'
              }`}
            >
              <div className="text-lg font-bold">{formatDate(date, 'dayNum')}</div>
            </button>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {generateMonthDays().map((date, index) => (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`h-10 rounded border transition-all text-sm ${
                isSelected(date)
                  ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                  : isToday(date)
                  ? 'border-orange-400 bg-orange-50 text-orange-900 font-bold'
                  : isCurrentMonth(date)
                  ? 'border-gray-200 bg-white hover:border-gray-300 text-gray-900'
                  : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
              }`}
            >
              {formatDate(date, 'dayNum')}
            </button>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Selected: {selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </Card>
  );
}

interface SubtaskRowProps {
  subtask: any;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit?: (subtask: any) => void;
}

function SubtaskRow({ subtask, isExpanded, onToggle, onEdit }: SubtaskRowProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    switch (priorityNum) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    switch (priorityNum) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      default: return 'Unknown';
    }
  };

  // Build scenario description from actual JSON structure
  const getScenarioDescription = () => {
    const parts = [];
    if (subtask.scenario) parts.push(subtask.scenario);
    if (subtask.lighting) parts.push(subtask.lighting);
    if (subtask.overlap) parts.push(`${subtask.overlap}% overlap`);
    if (subtask.target_speed) parts.push(`Target: ${subtask.target_speed}km/h`);
    if (subtask.ego_speed) parts.push(`Ego: ${subtask.ego_speed}km/h`);
    return parts.join(' • ') || 'No description';
  };

  return (
    <>
      {/* Main Row */}
      <tr className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer group" onClick={onToggle}>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center space-x-2">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium font-mono text-xs">{subtask.id || 'N/A'}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center space-x-2">
            {getStatusIcon(subtask.status)}
            <Badge variant="outline" className={`text-xs ${getStatusColor(subtask.status)}`}>
              {subtask.status}
            </Badge>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask.priority || 3)}`}>
            {getPriorityLabel(subtask.priority || 3)}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm truncate max-w-xs" title={getScenarioDescription()}>
          {getScenarioDescription()}
        </td>
        <td className="px-4 py-3 text-sm hidden md:table-cell">
          <Badge variant="outline" className="text-xs">
            {subtask.category || 'General'}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm hidden lg:table-cell">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{subtask.executedRuns || 0}</div>
            <div className="text-xs text-gray-500">/ {subtask.number_of_runs || 0}</div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm hidden xl:table-cell">
          {subtask.regulation || 'N/A'}
        </td>
        <td className="px-4 py-3 text-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(subtask);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Test Details:</span>
                <div className="text-gray-600 mt-1 space-y-1">
                  <div><strong>Category:</strong> {subtask.category || 'N/A'}</div>
                  <div><strong>Regulation:</strong> {subtask.regulation || 'N/A'}</div>
                  <div><strong>Scenario:</strong> {subtask.scenario || 'N/A'}</div>
                  <div><strong>Lighting:</strong> {subtask.lighting || 'N/A'}</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Speed & Performance:</span>
                <div className="text-gray-600 mt-1 space-y-1">
                  <div><strong>Target Speed:</strong> {subtask.target_speed || 'N/A'} km/h</div>
                  <div><strong>Ego Speed:</strong> {subtask.ego_speed || 'N/A'} km/h</div>
                  <div><strong>Overlap:</strong> {subtask.overlap || 'N/A'}%</div>
                  <div><strong>Brake:</strong> {subtask.brake || 'N/A'}</div>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Execution Status:</span>
                <div className="text-gray-600 mt-1 space-y-1">
                  <div><strong>Runs:</strong> {subtask.executedRuns || 0} / {subtask.number_of_runs || 0}</div>
                  <div><strong>Headway:</strong> {subtask.headway || 'N/A'}</div>
                  <div><strong>Street Lights:</strong> {subtask.street_lights || 'N/A'}</div>
                  <div><strong>Beam:</strong> {subtask.beam || 'N/A'}</div>
                </div>
              </div>
              {/* Show additional info for mobile */}
              <div className="md:hidden">
                <span className="font-medium text-gray-700">Mobile Info:</span>
                <div className="text-gray-600 mt-1">
                  <div><strong>Category:</strong> {subtask.category || 'General'}</div>
                  <div><strong>Runs Progress:</strong> {subtask.executedRuns || 0} / {subtask.number_of_runs || 0}</div>
                  <div><strong>Regulation:</strong> {subtask.regulation || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created: {new Date(subtask.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(subtask.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TaskPageContent() {
  const { user, token, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<TTTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [taskCounts, setTaskCounts] = useState<{ DC: number; TT: number }>({ DC: 0, TT: 0 });
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Timeline state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineView, setTimelineView] = useState<'carousel' | 'week' | 'month'>('carousel');

  const taskId = params.id as string;

  useEffect(() => {
    if (user && token && taskId) {
      fetchTask();
      fetchTaskCounts();
    }
  }, [user, token, taskId]);

  const fetchTask = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/tt', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const foundTask = data.data.find((t: TTTask) => t.id === taskId);
        if (foundTask) {
          const detailResponse = await fetch(`/api/tasks/tt/${taskId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            setTask(detailData.success ? detailData.data : foundTask);
          } else {
            setTask(foundTask);
          }
        } else {
          throw new Error('Task not found');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch task');
      }
    } catch (error: any) {
      console.error('Failed to fetch task:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
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
      console.error('Failed to fetch task counts:', error);
      setTaskCounts({ DC: 0, TT: 0 });
    }
  };

  const handleSectionChange = (section: 'DC' | 'TT' | 'management') => {
    if (section === 'DC') {
      router.push('/?section=DC');
    } else if (section === 'TT') {
      router.push('/?section=TT');
    } else if (section === 'management') {
      router.push('/?section=management');
    }
  };

  const handleRowToggle = (subtaskId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(subtaskId)) {
      newExpanded.delete(subtaskId);
    } else {
      newExpanded.add(subtaskId);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter subtasks based on search and filters using actual JSON structure
  const filteredSubtasks = task?.subtasks?.filter(subtask => {
    const scenarioDescription = [
      subtask.scenario,
      subtask.lighting,
      subtask.overlap && `${subtask.overlap}% overlap`,
      subtask.target_speed && `Target: ${subtask.target_speed}km/h`,
      subtask.ego_speed && `Ego: ${subtask.ego_speed}km/h`
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesSearch = !searchTerm || 
      scenarioDescription.includes(searchTerm.toLowerCase()) ||
      (subtask.id && subtask.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subtask.category && subtask.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || subtask.status === statusFilter;
    
    const priorityNum = typeof subtask.priority === 'string' ? parseInt(subtask.priority) : subtask.priority;
    const matchesPriority = priorityFilter === 'all' || 
      (priorityFilter === 'high' && priorityNum === 1) ||
      (priorityFilter === 'medium' && priorityNum === 2) ||
      (priorityFilter === 'low' && priorityNum === 3);
    
    const matchesCategory = categoryFilter === 'all' || subtask.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  }) || [];

  // Get unique categories for filter
  const categories = [...new Set(task?.subtasks?.map(s => s.category).filter(Boolean))] || [];

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
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuToggle={() => setIsSidebarOpen(true)}
        title="Test Track Task"
      />
      
      <div className="p-4 sm:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/?section=TT')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Loading task...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-2">Error: {error}</div>
            <Button onClick={fetchTask} variant="outline">
              Try Again
            </Button>
          </div>
        ) : task ? (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Task Header */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{task.title}</h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        🏁 TT
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{task.version}
                      </Badge>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 mb-4">{task.description}</p>
                  )}
                  
                  {/* Status and Priority Badges - Fixed Layout */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className={getPriorityColor(task.priority)} variant="outline">
                      Priority: {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)} variant="outline">
                      Status: {task.status}
                    </Badge>
                    <Badge variant="outline">
                      📍 {task.location}
                    </Badge>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="lg:w-80">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{task.completedSubtasks}/{task.totalSubtasks} ({task.progress}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Subtasks</span>
                        <div className="font-semibold">{task.totalSubtasks}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed</span>
                        <div className="font-semibold text-green-600">{task.completedSubtasks}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200 mt-6">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Created</div>
                    <div>{formatDate(task.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Updated</div>
                    <div>{formatDate(task.updatedAt)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">CSV File</div>
                    <div className="truncate">{task.csvFileName}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 bg-blue-100 rounded flex-shrink-0 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">{task.createdBy.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="font-medium">Created by</div>
                    <div>{task.createdBy}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline/Calendar Section */}
            <TimelineCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              view={timelineView}
              onViewChange={setTimelineView}
            />

            {/* Subtasks Section */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Subtasks ({filteredSubtasks.length} of {task.totalSubtasks})
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showSubtasks ? "default" : "outline"}
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className="flex items-center space-x-2"
                  >
                    <TestTube className="h-4 w-4" />
                    <span>{showSubtasks ? 'Hide Table' : 'Show Table'}</span>
                  </Button>
                  {showSubtasks && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  )}
                </div>
              </div>

              {showSubtasks && (
                <div className="space-y-4">
                  {/* Filters and Search */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative col-span-1 sm:col-span-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search subtasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Priority</option>
                      <option value="high">High (1)</option>
                      <option value="medium">Medium (2)</option>
                      <option value="low">Low (3)</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subtasks Table */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtask ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Scenario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Runs
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                            Regulation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSubtasks.map((subtask, index) => (
                          <SubtaskRow
                            key={subtask.id || index}
                            subtask={subtask}
                            isExpanded={expandedRows.has(subtask.id || index.toString())}
                            onToggle={() => handleRowToggle(subtask.id || index.toString())}
                            onEdit={(subtask) => console.log('Edit subtask:', subtask)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredSubtasks.length === 0 && (
                    <div className="text-center py-8">
                      <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Subtasks Found</h3>
                      <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                          ? 'Try adjusting your filters to see more subtasks.'
                          : 'This task has no subtasks yet.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!showSubtasks && (
                <div className="text-center py-8">
                  <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Subtask Management</h3>
                  <p className="text-gray-600 mb-4">
                    Click "Show Table" to view and manage {task.totalSubtasks} subtasks with detailed progress tracking.
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Task not found</div>
            <Button onClick={() => router.push('/?section=TT')} variant="outline">
              Back to Tasks
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentSection="TT" 
        onSectionChange={handleSectionChange}
        taskCounts={taskCounts}
      />
    </div>
  );
}

export default function TaskPage() {
  return (
    <AuthProvider>
      <TaskPageContent />
    </AuthProvider>
  );
} 