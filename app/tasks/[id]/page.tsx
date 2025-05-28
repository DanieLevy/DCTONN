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
      {/* View Switcher - Moved to top */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <Button
            variant={view === 'carousel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('carousel')}
            className={`h-8 px-4 rounded-md transition-all ${
              view === 'carousel' 
                ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <CalendarRange className="h-3 w-3 mr-2" />
            Days
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            className={`h-8 px-4 rounded-md transition-all ${
              view === 'week' 
                ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <CalendarDays className="h-3 w-3 mr-2" />
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('month')}
            className={`h-8 px-4 rounded-md transition-all ${
              view === 'month' 
                ? 'bg-white shadow-sm border border-gray-200 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Grid3X3 className="h-3 w-3 mr-2" />
            Month
          </Button>
        </div>
      </div>

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
            onClick={() => onDateSelect(new Date())}
            className="text-blue-600 hover:text-blue-700"
          >
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
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

// New interface for scenario groups
interface ScenarioGroupProps {
  scenario: string;
  subtasks: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditSubtask?: (subtask: any) => void;
}

function ScenarioGroupRow({ scenario, subtasks, isExpanded, onToggle, onEditSubtask }: ScenarioGroupProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
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

  // Calculate combined statistics with proper null/undefined handling
  const totalRuns = subtasks.reduce((sum, s) => {
    const runs = parseInt(s.number_of_runs) || 0;
    return sum + runs;
  }, 0);
  
  const executedRuns = subtasks.reduce((sum, s) => {
    const execRuns = parseInt(s.executedRuns) || 0;
    return sum + execRuns;
  }, 0);

  const completedCount = subtasks.filter(s => s.status === 'completed').length;
  const inProgressCount = subtasks.filter(s => s.status === 'in_progress').length;
  const pausedCount = subtasks.filter(s => s.status === 'paused').length;
  const pendingCount = subtasks.filter(s => s.status === 'pending').length;

  // Get dominant status
  const statusCounts = { completed: completedCount, in_progress: inProgressCount, paused: pausedCount, pending: pendingCount };
  const dominantStatus = Object.entries(statusCounts).reduce((a, b) => statusCounts[a[0] as keyof typeof statusCounts] > statusCounts[b[0] as keyof typeof statusCounts] ? a : b)[0] as keyof typeof statusCounts;

  // Get dominant priority (lowest number = highest priority)
  const priorities = subtasks.map(s => parseInt(s.priority) || 3);
  const dominantPriority = Math.min(...priorities);

  // Calculate completion percentage
  const completionPercentage = totalRuns > 0 ? Math.round((executedRuns / totalRuns) * 100) : 0;

  return (
    <>
      {/* Scenario Group Row - Simplified flat design */}
      <div 
        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200 last:border-b-0"
        onClick={onToggle}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Scenario info */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                <div className={`w-3 h-3 rounded-full ${getStatusDot(dominantStatus)}`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-gray-900 truncate">{scenario || 'Unknown Scenario'}</h3>
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 flex-shrink-0">
                    {subtasks.length}
                  </Badge>
                </div>
                
                {/* Progress info inline - Mobile responsive */}
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span className="hidden sm:inline">{completionPercentage}% complete</span>
                  <span>{executedRuns}/{totalRuns} runs</span>
                  {subtasks.length > 1 && (
                    <span className="hidden md:inline text-xs">
                      ({completedCount}✓ {inProgressCount}⏵ {pausedCount}⏸ {pendingCount}⏳)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Status indicators */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="hidden sm:flex items-center space-x-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor(dominantStatus)}`}>
                  {dominantStatus.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(dominantPriority)}`}>
                  P{dominantPriority}
                </Badge>
              </div>
              
              {/* Compact progress indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-12 bg-gray-200 rounded-full h-1.5 hidden sm:block">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Individual Subtasks */}
      {isExpanded && (
        <div className="bg-gray-50 border-b border-gray-200 last:border-b-0">
          {subtasks.map((subtask, index) => (
            <SubtaskRow
              key={subtask.id || index}
              subtask={subtask}
              isExpanded={false}
              onToggle={() => {}}
              onEdit={() => onEditSubtask?.(subtask)}
              isGrouped={true}
            />
          ))}
        </div>
      )}
    </>
  );
}

function SubtaskRow({ subtask, isExpanded, onToggle, onEdit, isGrouped = false }: SubtaskRowProps & { isGrouped?: boolean }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
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
    if (subtask.lighting) parts.push(subtask.lighting);
    if (subtask.overlap) parts.push(`${subtask.overlap}% overlap`);
    if (subtask.target_speed) parts.push(`Target: ${subtask.target_speed}km/h`);
    if (subtask.ego_speed) parts.push(`Ego: ${subtask.ego_speed}km/h`);
    return parts.join(' • ') || 'No description';
  };

  const executedRuns = parseInt(subtask.executedRuns) || 0;
  const totalRuns = parseInt(subtask.number_of_runs) || 0;
  const completionPercentage = totalRuns > 0 ? Math.round((executedRuns / totalRuns) * 100) : 0;

  return (
    <div 
      className="border-b border-gray-300 last:border-b-0 hover:bg-gray-100 cursor-pointer transition-all duration-200 px-8 py-3" 
      onClick={() => onEdit?.(subtask)}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Subtask info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full ${getStatusDot(subtask.status)} flex-shrink-0`}></div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-900 truncate">
                {subtask.scenario || 'Unknown Scenario'}
              </span>
              <span className="font-mono text-xs text-gray-500 flex-shrink-0">
                #{subtask.id}
              </span>
            </div>
            
            {/* Additional info on mobile */}
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600 sm:hidden">
              <Badge variant="outline" className={`text-xs ${getStatusColor(subtask.status)}`}>
                {subtask.status}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask.priority || 3)}`}>
                P{subtask.priority || 3}
              </Badge>
              <span>{executedRuns}/{totalRuns} runs</span>
            </div>
          </div>
        </div>

        {/* Right side - Status and progress */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Desktop badges */}
          <div className="hidden sm:flex items-center space-x-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor(subtask.status)}`}>
              {subtask.status}
            </Badge>
            <Badge variant="outline" className={`text-xs ${getPriorityColor(subtask.priority || 3)}`}>
              P{subtask.priority || 3}
            </Badge>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 hidden sm:inline">
              {executedRuns}/{totalRuns}
            </span>
            <div className="w-8 bg-gray-200 rounded-full h-1.5 hidden md:block">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 font-medium hidden md:inline">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// New interface for subtask detail modal
interface SubtaskDetailModalProps {
  subtask: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (subtask: any) => void;
}

function SubtaskDetailModal({ subtask, isOpen, onClose, onEdit }: SubtaskDetailModalProps) {
  if (!isOpen || !subtask) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Play className="h-5 w-5 text-blue-600" />;
      case 'paused': return <Pause className="h-5 w-5 text-yellow-600" />;
      default: return <div className="h-5 w-5 rounded-full bg-gray-300" />;
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
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Unknown Priority';
    }
  };

  const completionPercentage = subtask.number_of_runs > 0 
    ? Math.round((subtask.executedRuns / subtask.number_of_runs) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {getStatusIcon(subtask.status)}
                <h2 className="text-xl font-semibold text-gray-900">{subtask.scenario || 'Subtask Details'}</h2>
                <Badge variant="outline" className={`${getStatusColor(subtask.status)}`}>
                  {subtask.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Subtask ID: {subtask.id}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Execution Progress</span>
                <span className="text-lg font-bold text-blue-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-600">
                {subtask.executedRuns || 0} of {subtask.number_of_runs || 0} runs completed
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Priority</span>
                <Badge className={getPriorityColor(subtask.priority || 3)} variant="outline">
                  P{subtask.priority || 3}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                {getPriorityLabel(subtask.priority || 3)}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700">Category</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {subtask.category || 'General'}
                </Badge>
              </div>
              <div className="text-xs text-green-600">
                Test category classification
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Test Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Scenario:</span>
                  <span className="text-sm text-gray-900">{subtask.scenario || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Regulation:</span>
                  <span className="text-sm text-gray-900">{subtask.regulation || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Lighting Conditions:</span>
                  <span className="text-sm text-gray-900">{subtask.lighting || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Overlap Percentage:</span>
                  <span className="text-sm text-gray-900">{subtask.overlap || 'N/A'}%</span>
                </div>
              </div>
            </div>

            {/* Speed & Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Speed & Performance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Target Speed:</span>
                  <span className="text-sm text-gray-900">{subtask.target_speed || 'N/A'} km/h</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Ego Speed:</span>
                  <span className="text-sm text-gray-900">{subtask.ego_speed || 'N/A'} km/h</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Brake Setting:</span>
                  <span className="text-sm text-gray-900">{subtask.brake || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Headway:</span>
                  <span className="text-sm text-gray-900">{subtask.headway || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Environmental Conditions
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Street Lights:</span>
                  <span className="text-sm text-gray-900">{subtask.street_lights || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Beam Type:</span>
                  <span className="text-sm text-gray-900">{subtask.beam || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Execution Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Execution Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Total Runs:</span>
                  <span className="text-sm text-gray-900">{subtask.number_of_runs || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Executed Runs:</span>
                  <span className="text-sm text-gray-900">{subtask.executedRuns || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-700">Completion Rate:</span>
                  <span className="text-sm text-gray-900">{completionPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <strong>Created:</strong> {subtask.createdAt ? new Date(subtask.createdAt).toLocaleString() : 'N/A'}
              </div>
              <div>
                <strong>Last Updated:</strong> {subtask.updatedAt ? new Date(subtask.updatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onEdit && (
            <Button onClick={() => onEdit(subtask)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Subtask
            </Button>
          )}
        </div>
      </div>
    </div>
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
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  
  // Timeline state - Start with today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineView, setTimelineView] = useState<'carousel' | 'week' | 'month'>('month');

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

  // Group subtasks by scenario
  const groupedSubtasks = filteredSubtasks.reduce((groups, subtask) => {
    const scenario = subtask.scenario || 'Unknown Scenario';
    if (!groups[scenario]) {
      groups[scenario] = [];
    }
    groups[scenario].push(subtask);
    return groups;
  }, {} as Record<string, any[]>);

  // Convert to array for rendering
  const scenarioGroups = Object.entries(groupedSubtasks).map(([scenario, subtasks]) => ({
    scenario,
    subtasks,
    // Generate a unique ID for the group
    id: scenario.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  }));

  // Get unique categories for filter
  const categories = [...new Set(task?.subtasks?.map(s => s.category).filter(Boolean) || [])];

  // Handle redirect when user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [loading, user, router]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
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
                    </div>
                  </div>
                      {task.version && (
                        <Badge variant="outline" className="text-xs">
                          v{task.version}
                        </Badge>
                      )}
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
                {/* <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">CSV File</div>
                    <div className="truncate">{task.csvFileName}</div>
                  </div>
                </div> */}
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Scenarios ({scenarioGroups.length})
                  </h2>
                  <p className="text-sm text-gray-600">
                    {filteredSubtasks.length} subtasks across {scenarioGroups.length} scenarios
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Combined Filters - More Compact */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search scenarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-[120px]"
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
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  {categories.length > 0 && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Scenarios List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {scenarioGroups.map(({ scenario, subtasks }) => (
                    <ScenarioGroupRow
                      key={scenario}
                      scenario={scenario}
                      subtasks={subtasks}
                      isExpanded={expandedRows.has(scenario)}
                      onToggle={() => handleRowToggle(scenario)}
                      onEditSubtask={(subtask) => setSelectedSubtask(subtask)}
                    />
                  ))}
                </div>

                {scenarioGroups.length === 0 && (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Scenarios Found</h3>
                    <p className="text-gray-600">
                      {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'Try adjusting your filters to see more scenarios.'
                        : 'This task has no subtasks yet.'}
                    </p>
                  </div>
                )}
              </div>
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

      {/* Subtask Detail Modal */}
      {selectedSubtask && (
        <SubtaskDetailModal
          subtask={selectedSubtask}
          isOpen={!!selectedSubtask}
          onClose={() => setSelectedSubtask(null)}
        />
      )}
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