'use client';

import { TTTask } from '@/lib/types';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Clock, 
  FileText,
  Edit3,
  ChevronRight,
  Calendar
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
      className="bg-white border-t border-b border-gray-200 px-0 py-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 group -mb-px"
    >
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center px-6">
        {/* Task Title & Type - 4 columns */}
        <div className="col-span-4">
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors truncate">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  🏁 TT
                </Badge>
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                  v{task.version}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Metadata - 3 columns */}
        <div className="col-span-3">
          <div className="space-y-2">
            <div className="flex items-center text-gray-700">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              <span className="font-medium">{task.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="h-3 w-3 mr-2" />
              <span>{task.totalSubtasks} subtasks</span>
            </div>
          </div>
        </div>

        {/* Progress - 2 columns */}
        <div className="col-span-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {task.completedSubtasks}/{task.totalSubtasks} completed
            </div>
          </div>
        </div>

        {/* Status & Actions - 3 columns */}
        <div className="col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(task.updatedAt)}</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-3" />
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden px-6">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors truncate">
                {task.title}
              </h3>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                🏁 TT
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-3 w-3 mr-2" />
                <span>{task.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FileText className="h-3 w-3 mr-2" />
                <span>{task.totalSubtasks} subtasks</span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{task.progress}%</div>
              <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden px-6">
        <div className="space-y-3">
          {/* Title and badges */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                {task.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  🏁 TT
                </Badge>
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                  v{task.version}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
          </div>

          {/* Location and metadata */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-gray-600">
              <MapPin className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="truncate">{task.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
              <span>{task.totalSubtasks} subtasks</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">{task.completedSubtasks}/{task.totalSubtasks} ({task.progress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Status and priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
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
    </div>
  );
} 