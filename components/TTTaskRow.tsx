'use client';

import { TTTask } from '@/lib/types';
import { Badge } from './ui/badge';
import { 
  MapPin, 
  Clock, 
  FileText,
  Edit3,
  ChevronRight
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
      className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-all duration-200 group"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-900 text-base truncate group-hover:text-blue-600 transition-colors">
              {task.title}
            </h3>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              🏁 TT
            </Badge>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              v{task.version}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span>{task.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span>{task.totalSubtasks} subtasks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>Updated: {formatDate(task.updatedAt)}</span>
            </div>
            {task.lastEditedBy && (
              <div className="flex items-center space-x-1">
                <Edit3 className="h-3 w-3 flex-shrink-0" />
                <span>by {task.lastEditedBy}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center - Progress */}
        <div className="mx-6 min-w-0 flex-shrink-0 hidden md:block">
          <div className="text-xs text-gray-600 mb-1 text-center">
            {task.completedSubtasks}/{task.totalSubtasks} ({task.progress}%)
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Right side - Status and priority */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="mt-3 md:hidden">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{task.completedSubtasks}/{task.totalSubtasks} ({task.progress}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 