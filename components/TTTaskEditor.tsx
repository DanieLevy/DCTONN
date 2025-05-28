'use client';

import { useState, useEffect } from 'react';
import { TTTask, TTSubtask } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  X, 
  Save, 
  Edit3, 
  Plus,
  Trash2,
  History,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface TTTaskEditorProps {
  task: TTTask;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export function TTTaskEditor({ task, onClose, onTaskUpdated }: TTTaskEditorProps) {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<TTSubtask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status
  });

  const [subtaskForm, setSubtaskForm] = useState<Partial<TTSubtask>>({});

  // Initialize subtask form when editing a subtask
  useEffect(() => {
    if (editingSubtask) {
      setSubtaskForm({ ...editingSubtask });
    } else {
      setSubtaskForm({});
    }
  }, [editingSubtask]);

  const handleTaskUpdate = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/tt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: task.id,
          updateType: 'task',
          updates: taskForm
        })
      });

      const result = await response.json();
      if (result.success) {
        onTaskUpdated();
        alert('Task updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubtaskUpdate = async () => {
    if (!user || !token || !editingSubtask) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks/tt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: task.id,
          updateType: 'subtask',
          updates: {
            subtaskId: editingSubtask.id,
            subtaskUpdates: subtaskForm
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingSubtask(null);
        onTaskUpdated();
        alert('Subtask updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      alert(`Failed to update subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit TT Task</h2>
              <p className="text-sm text-gray-500">Version {task.version} • Last edited by {task.lastEditedBy || 'Unknown'}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Task Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Task Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={taskForm.status}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleTaskUpdate} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Task Changes'}
                  </Button>
                </div>

                {/* Task Info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Created: {formatDate(task.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated: {formatDate(task.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Created by: {task.createdBy}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Change History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {task.changeLog && task.changeLog.length > 0 ? (
                    task.changeLog.slice().reverse().map((entry) => (
                      <div key={entry.id} className="border-l-2 border-blue-200 pl-3 py-2 bg-gray-50 rounded-r">
                        <div className="text-sm text-gray-700">{entry.description}</div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between">
                          <span>by {entry.userName}</span>
                          <span>{formatDate(entry.timestamp)}</span>
                        </div>
                        {entry.fieldChanged && (
                          <div className="text-xs text-blue-600 mt-1">
                            Field: {entry.fieldChanged}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No changes recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subtasks Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subtasks ({task.subtasks.length})</span>
                <Badge variant="outline">
                  {task.completedSubtasks}/{task.totalSubtasks} completed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Subtask Editor Modal */}
              {editingSubtask && (
                <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <h4 className="font-medium text-blue-900 mb-3">Editing Subtask: {editingSubtask.category} - {editingSubtask.scenario}</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={subtaskForm.category || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scenario">Scenario</Label>
                      <Input
                        id="scenario"
                        value={subtaskForm.scenario || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, scenario: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lighting">Lighting</Label>
                      <select
                        id="lighting"
                        value={subtaskForm.lighting || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, lighting: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daylight">Daylight</option>
                        <option value="night">Night</option>
                        <option value="dusk">Dusk</option>
                        <option value="dawn">Dawn</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="target_speed">Target Speed</Label>
                      <Input
                        id="target_speed"
                        value={subtaskForm.target_speed || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, target_speed: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={subtaskForm.priority || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={subtaskForm.status || ''}
                        onChange={(e) => setSubtaskForm(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={handleSubtaskUpdate} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Subtask
                    </Button>
                    <Button variant="outline" onClick={() => setEditingSubtask(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{subtask.category} - {subtask.scenario}</span>
                        <Badge className={getStatusColor(subtask.status)} variant="secondary">
                          {subtask.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          v{subtask.version}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {subtask.lighting} | {subtask.target_speed} km/h | Priority: {subtask.priority}
                        {subtask.lastEditedBy && (
                          <span className="ml-2">• Last edited by {subtask.lastEditedBy}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSubtask(subtask)}
                      disabled={editingSubtask?.id === subtask.id}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 