'use client';

import { TTTask } from '@/lib/types';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Clock, 
  FileText,
  ChevronRight,
  CheckCircle2,
  Circle,
  TrendingUp
} from 'lucide-react';

interface TTTaskRowProps {
  task: TTTask;
  onClick: () => void;
}

export function TTTaskRow({ task, onClick }: TTTaskRowProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 ring-1 ring-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
      case 'paused': return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 ring-1 ring-gray-100';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-300';
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-amber-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getProgressIcon = (progress: number) => {
    if (progress === 100) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (progress > 0) {
      return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group mx-4 mb-4 overflow-hidden"
    >
      {/* Mobile Layout (Primary focus based on your screenshot) */}
      <div className="block md:hidden">
        <div className="p-5 space-y-4">
          {/* Header with title and status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors mb-2">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  🏁 TT
                </Badge>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                  v{task.version || 'v'}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
          </div>

          {/* Location and metadata row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium text-sm">{task.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">{task.totalSubtasks} subtasks</span>
            </div>
          </div>

          {/* Enhanced progress section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getProgressIcon(task.progress)}
                <span className="text-sm font-medium text-gray-700">Progress</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {task.completedSubtasks || 0}/{task.totalSubtasks} 
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({task.progress || 0}%)
                </span>
              </span>
            </div>
            
            {/* Enhanced progress bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor(task.progress || 0)}`}
                  style={{ width: `${task.progress || 0}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20"></div>
                </div>
              </div>
              {/* Progress percentage overlay for better visibility */}
              {(task.progress || 0) > 15 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {task.progress || 0}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status badges and timestamp */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor(task.status)} text-xs font-medium`}>
                {task.status}
              </Badge>
              <Badge className={`${getPriorityColor(task.priority)} text-xs font-medium`}>
                {task.priority}
              </Badge>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(task.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="font-semibold text-gray-900 text-xl group-hover:text-blue-600 transition-colors truncate">
                  {task.title}
                </h3>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  🏁 TT
                </Badge>
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                  v{task.version || 'v'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">{task.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium">{task.totalSubtasks} subtasks</span>
                </div>
              </div>
            </div>

            {/* Right side - Progress and status */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-2">
                  {getProgressIcon(task.progress)}
                  <span className="text-lg font-bold text-gray-900">{task.progress || 0}%</span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(task.progress || 0)}`}
                    style={{ width: `${task.progress || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {task.completedSubtasks || 0}/{task.totalSubtasks}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Badge className={`${getStatusColor(task.status)} font-medium`}>
                  {task.status}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)} font-medium`}>
                  {task.priority}
                </Badge>
              </div>
              
              <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6 items-center">
            {/* Task Title & Type - 4 columns */}
            <div className="col-span-4">
              <div className="flex items-start space-x-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                      🏁 TT
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                      v{task.version || 'v'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Metadata - 3 columns */}
            <div className="col-span-3">
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-3 text-gray-500" />
                  <span className="font-medium">{task.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-3 text-gray-500" />
                  <span className="font-medium">{task.totalSubtasks} subtasks</span>
                </div>
              </div>
            </div>

            {/* Enhanced Progress - 3 columns */}
            <div className="col-span-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getProgressIcon(task.progress)}
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{task.progress || 0}%</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(task.progress || 0)}`}
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {task.completedSubtasks || 0}/{task.totalSubtasks} completed
                </div>
              </div>
            </div>

            {/* Status & Actions - 2 columns */}
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(task.status)} font-medium`}>
                      {task.status}
                    </Badge>
                    <Badge className={`${getPriorityColor(task.priority)} font-medium`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-2" />
                    <span>{formatDate(task.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors ml-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 