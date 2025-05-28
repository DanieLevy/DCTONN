'use client';

import { useState } from 'react';
import { Task, TTTask } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TTTaskEditor } from './TTTaskEditor';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Tag,
  History,
  Edit3,
  FileText
} from 'lucide-react';

interface TaskCardProps {
  task: Task | TTTask;
  onTaskUpdated?: () => void;
}

export function TaskCard({ task, onTaskUpdated }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if this is a TT task
  const isTTTask = (task: Task | TTTask): task is TTTask => {
    return task.category === 'TT';
  };

  // TT Task Rendering
  if (isTTTask(task)) {
    return (
      <div className="bg-white border-t border-b border-gray-200 px-0 py-5 hover:bg-gray-50 transition-all duration-200 group -mb-px">
        <div className="px-6">
          {/* TT Task Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                <Badge variant="outline" className="text-xs">
                  🏁 TT
                </Badge>
                <Badge variant="outline" className="text-xs">
                  v{task.version}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{task.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>{task.totalSubtasks} subtasks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated: {formatDate(task.updatedAt)}</span>
                </div>
                {task.lastEditedBy && (
                  <div className="flex items-center space-x-1">
                    <Edit3 className="h-3 w-3" />
                    <span>by {task.lastEditedBy}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge className={getStatusColor(task.status)}>
                {task.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditor(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-gray-500 hover:text-gray-700"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{task.completedSubtasks}/{task.totalSubtasks} completed ({task.progress}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <History className="h-4 w-4 mr-2" />
                Change History
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {task.changeLog && task.changeLog.length > 0 ? (
                  task.changeLog.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="text-xs border-l-2 border-blue-200 pl-3 py-1">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-700">{entry.description}</span>
                        <span className="text-gray-500 ml-2">{formatDate(entry.timestamp)}</span>
                      </div>
                      <div className="text-gray-500 mt-1">by {entry.userName}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">No changes recorded yet</div>
                )}
              </div>
              {task.changeLog && task.changeLog.length > 5 && (
                <div className="text-xs text-blue-600 mt-2 cursor-pointer hover:underline">
                  View all {task.changeLog.length} changes
                </div>
              )}
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {task.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{task.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">CSV File:</span>
                  <p className="text-gray-600">{task.csvFileName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <p className="text-gray-600">{formatDate(task.createdAt)} by {task.createdBy}</p>
                </div>
              </div>

              {/* Sample Subtasks Preview */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Sample Subtasks:</span>
                  <div className="mt-2 space-y-1">
                    {task.subtasks.slice(0, 3).map((subtask, index) => (
                      <div key={subtask.id} className="text-xs bg-gray-50 p-2 rounded border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{subtask.category} - {subtask.scenario}</span>
                          <Badge variant="outline" className="text-xs">
                            {subtask.status}
                          </Badge>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {subtask.lighting} | {subtask.target_speed} km/h | Priority: {subtask.priority}
                        </div>
                      </div>
                    ))}
                    {task.subtasks.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        ... and {task.subtasks.length - 3} more subtasks
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* TT Task Editor Modal */}
        {showEditor && (
          <TTTaskEditor
            task={task}
            onClose={() => setShowEditor(false)}
            onTaskUpdated={() => {
              setShowEditor(false);
              onTaskUpdated?.();
            }}
          />
        )}
      </div>
    );
  }

  // DC Task Rendering (existing logic)
  const dcTask = task as Task;
  return (
    <div className="bg-white border-t border-b border-gray-200 px-0 py-5 hover:bg-gray-50 transition-all duration-200 group -mb-px">
      <div className="px-6">
        {/* DC Task Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">{dcTask.title}</h3>
              <Badge variant="outline" className="text-xs">
                📊 DC
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{dcTask.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Tag className="h-3 w-3" />
                <span>{dcTask.type}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Car className="h-3 w-3" />
                <span>{dcTask.targetCar}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(dcTask.priority)}>
              {dcTask.priority}
            </Badge>
            <Badge className={getStatusColor(dcTask.status)}>
              {dcTask.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Content for DC Tasks */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Weather:</span>
                <p className="text-gray-600">{dcTask.weather}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Road Type:</span>
                <p className="text-gray-600">{dcTask.roadType}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Illumination:</span>
                <p className="text-gray-600">{dcTask.illumination}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Project:</span>
                <p className="text-gray-600">{dcTask.project}</p>
              </div>
            </div>

            {dcTask.executionDetails && (
              <div>
                <span className="font-medium text-gray-700">Execution Details:</span>
                <p className="text-gray-600 mt-1">{dcTask.executionDetails}</p>
              </div>
            )}

            {dcTask.executionLocation && (
              <div>
                <span className="font-medium text-gray-700">Execution Location:</span>
                <p className="text-gray-600">{dcTask.executionLocation}</p>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Created: {formatDate(dcTask.createdAt)} by {dcTask.createdBy}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 