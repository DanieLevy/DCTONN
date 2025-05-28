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
  TrendingUp,
  PlayCircle
} from 'lucide-react';

interface TTTaskRowProps {
  task: TTTask;
  onClick: () => void;
}

export function TTTaskRow({ task, onClick }: TTTaskRowProps) {
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

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (progress >= 50) return <Clock className="h-4 w-4 text-blue-600" />;
    if (progress > 0) return <PlayCircle className="h-4 w-4 text-orange-600" />;
    return <Circle className="h-4 w-4 text-gray-400" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (progress >= 75) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (progress >= 50) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (progress >= 25) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate actual progress based on isExecuted and completed status
  // Handle case where subtasks might be undefined (in list views for performance)
  const completedSubtasks = task.subtasks 
    ? task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length
    : task.completedSubtasks || 0;
  const actualProgress = task.subtasks
    ? (task.totalSubtasks > 0 ? Math.round((completedSubtasks / task.totalSubtasks) * 100) : 0)
    : task.progress || 0;

  return (
    <div 
      className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  🏁 TT
                </Badge>
                <span className="text-xs text-gray-500">v{task.version}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate group-hover:text-blue-700 transition-colors">
                {task.title}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{task.totalSubtasks} tasks</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated: {formatDate(task.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getProgressIcon(actualProgress)}
                <span className="text-sm font-medium text-gray-700">Progress</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {completedSubtasks || 0}/{task.totalSubtasks} 
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({actualProgress}%)
                </span>
              </span>
            </div>
            
            {/* Enhanced progress bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor(actualProgress)}`}
                  style={{ width: `${actualProgress}%` }}
                >
                  <div className="h-full w-full bg-gradient-to-r from-transparent to-white/20"></div>
                </div>
              </div>
              {/* Progress percentage overlay for better visibility */}
              {actualProgress > 15 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {actualProgress}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status badges and timestamp */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Badge className={`${getStatusColor(task.status)} font-medium text-xs`}>
                {task.status}
              </Badge>
              <Badge className={`${getPriorityColor(task.priority)} font-medium text-xs`}>
                {task.priority}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              {task.lastEditedBy && `by ${task.lastEditedBy}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium">
                  🏁 TT
                </Badge>
                <span className="text-xs text-gray-500">v{task.version}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate group-hover:text-blue-700 transition-colors">
                {task.title}
              </h3>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{task.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{task.totalSubtasks} subtasks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Updated: {formatDate(task.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-2">
                  {getProgressIcon(actualProgress)}
                  <span className="text-lg font-bold text-gray-900">{actualProgress}%</span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(actualProgress)}`}
                    style={{ width: `${actualProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {completedSubtasks || 0}/{task.totalSubtasks}
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
          {/* Enhanced desktop grid layout */}
          <div className="grid grid-cols-12 gap-4 items-center">
            {/* Task Info - 5 columns */}
            <div className="col-span-5">
              <div className="flex items-center space-x-3 mb-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-medium px-2 py-1">
                  🏁 TT
                </Badge>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                  v{task.version}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors leading-tight">
                {task.title}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{task.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{task.totalSubtasks} subtasks</span>
                </div>
              </div>
            </div>
            
            {/* Progress Section - 3 columns */}
            <div className="col-span-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getProgressIcon(actualProgress)}
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{actualProgress}%</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(actualProgress)}`}
                      style={{ width: `${actualProgress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {completedSubtasks || 0}/{task.totalSubtasks} completed
                </div>
              </div>
            </div>

            {/* Status & Actions - 2 columns */}
            <div className="col-span-2">
              <div className="flex flex-col space-y-2">
                <Badge className={`${getStatusColor(task.status)} font-medium justify-center`}>
                  {task.status}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)} font-medium justify-center`}>
                  {task.priority}
                </Badge>
              </div>
            </div>

            {/* Metadata & Action - 2 columns */}
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    Updated: {formatDate(task.updatedAt)}
                  </div>
                  {task.lastEditedBy && (
                    <div className="text-xs text-gray-400">
                      by {task.lastEditedBy}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors ml-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 