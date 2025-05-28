'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Users, 
  FileText, 
  Settings,
  Eye,
  UserPlus,
  Save,
  ArrowLeft,
  Upload,
  Database,
  TestTube,
  Edit,
  Check,
  Play,
  Pause,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Task, TTTask, User } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { TTTaskRow } from './TTTaskRow';
import { TTFileUpload } from './TTFileUpload';

interface DashboardProps {
  onBackToTasks: () => void;
  onRefreshTasks?: () => void;
}

// Modal component for editing tasks
interface EditTaskModalProps {
  task: Task | TTTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | TTTask) => void;
  type: 'DC' | 'TT';
}

function EditTaskModal({ task, isOpen, onClose, onSave, type }: EditTaskModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (task) {
      setFormData({ ...task });
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      onSave({ ...task, ...formData } as Task | TTTask);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit {type} Task</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            
            {type === 'DC' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Input
                  value={formData.type || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="Task type"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority || 'medium'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={formData.location || 'EU'}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="EU">EU</option>
                <option value="USA">USA</option>
                <option value="IL">IL</option>
              </select>
            </div>

            {type === 'TT' && formData.version && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <Input
                  value={formData.version || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="Version"
                />
              </div>
            )}
          </div>

          {type === 'DC' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.executionDetails || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, executionDetails: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Task description and execution details"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Car</label>
                  <Input
                    value={formData.targetCar || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetCar: e.target.value }))}
                    placeholder="Target vehicle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                  <Input
                    value={formData.weather || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
                    placeholder="Weather conditions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Road Type</label>
                  <Input
                    value={formData.roadType || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, roadType: e.target.value }))}
                    placeholder="Road type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Illumination</label>
                  <Input
                    value={formData.illumination || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, illumination: e.target.value }))}
                    placeholder="Lighting conditions"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'TT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Task description"
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// Modal component for editing subtasks
interface EditSubtaskModalProps {
  subtask: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subtask: any) => void;
}

function EditSubtaskModal({ subtask, isOpen, onClose, onSave }: EditSubtaskModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (subtask) {
      setFormData({ ...subtask });
    }
  }, [subtask]);

  const handleSave = () => {
    if (subtask) {
      onSave({ ...subtask, ...formData } as any);
    }
  };

  if (!isOpen || !subtask) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Subtask: {formData.id}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'pending'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority || 3}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>High (1)</option>
                <option value={2}>Medium (2)</option>
                <option value={3}>Low (3)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regulation</label>
              <Input
                value={formData.regulation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, regulation: e.target.value }))}
                placeholder="Regulation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
              <Input
                value={formData.scenario || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, scenario: e.target.value }))}
                placeholder="Scenario"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lighting</label>
              <Input
                value={formData.lighting || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lighting: e.target.value }))}
                placeholder="Lighting conditions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Speed (km/h)</label>
              <Input
                type="number"
                value={formData.target_speed || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, target_speed: e.target.value }))}
                placeholder="Target speed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ego Speed (km/h)</label>
              <Input
                type="number"
                value={formData.ego_speed || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, ego_speed: e.target.value }))}
                placeholder="Ego speed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overlap (%)</label>
              <Input
                type="number"
                value={formData.overlap || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, overlap: e.target.value }))}
                placeholder="Overlap percentage"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Runs</label>
              <Input
                type="number"
                value={formData.number_of_runs || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, number_of_runs: parseInt(e.target.value) || 0 }))}
                placeholder="Total number of runs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Executed Runs</label>
              <Input
                type="number"
                value={formData.executedRuns || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, executedRuns: parseInt(e.target.value) || 0 }))}
                placeholder="Executed runs"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brake</label>
              <Input
                value={formData.brake || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, brake: e.target.value }))}
                placeholder="Brake setting"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onBackToTasks, onRefreshTasks }: DashboardProps) {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'dc-tasks' | 'tt-tasks' | 'users'>('dc-tasks');
  const [dcTasks, setDcTasks] = useState<Task[]>([]);
  const [ttTasks, setTtTasks] = useState<TTTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | TTTask | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<any>(null);
  const [editingTTTask, setEditingTTTask] = useState<TTTask | null>(null);
  const [selectedTTTask, setSelectedTTTask] = useState<TTTask | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showTTUpload, setShowTTUpload] = useState(false);
  
  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: '',
    category: 'DC', // Default to Data Collection
    location: user?.location || 'EU',
    priority: 'medium',
    status: 'active',
    targetCar: '',
    weather: '',
    roadType: '',
    illumination: '',
    project: '',
    executionLocation: '',
    executionDetails: '',
    labels: '',
    extraSensor: '',
    datacoNumber: '',
    additionalInfo: '',
    exampleImages: ''
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
    location: 'EU',
    permissions: ['EU']
  });

  useEffect(() => {
    if (user && token) {
      loadDCTasks();
      loadTTTasks();
      if (user.role === 'admin') {
        loadUsers();
      }
    }
  }, [user, token]);

  const loadDCTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDcTasks(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load DC tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTTTasks = async () => {
    try {
      const response = await fetch('/api/tasks/tt', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTtTasks(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load TT tasks:', error);
    }
  };

  const loadTTTaskDetails = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/tt/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedTTTask(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load TT task details:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users);
        }
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleEditDCTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleEditTTTask = (task: TTTask) => {
    setEditingTTTask(task);
  };

  const handleSaveDCTask = async (updatedTask: Task | TTTask) => {
    if (!editingTask || !token) return;

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        setEditingTask(null);
        await loadDCTasks();
        onRefreshTasks?.();
      } else {
        console.error('Failed to update DC task');
      }
    } catch (error) {
      console.error('Error updating DC task:', error);
    }
  };

  const handleSaveTTTask = async (updatedTask: Task | TTTask) => {
    if (!editingTTTask || !token) return;

    try {
      const response = await fetch(`/api/tasks/tt/${editingTTTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

      if (response.ok) {
        setEditingTTTask(null);
        await loadTTTasks();
        onRefreshTasks?.();
      } else {
        console.error('Failed to update TT task');
      }
    } catch (error) {
      console.error('Error updating TT task:', error);
    }
  };

  const handleSaveSubtask = async (updatedSubtask: any) => {
    if (!selectedTTTask) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${selectedTTTask.id}/subtasks/${updatedSubtask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSubtask),
      });

      if (response.ok) {
        await loadTTTaskDetails(selectedTTTask.id);
        await loadTTTasks();
        setEditingSubtask(null);
        onRefreshTasks?.();
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDCTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadDCTasks();
        onRefreshTasks?.();
      }
    } catch (error) {
      console.error('Failed to delete DC task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTTTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this TT task?')) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadTTTasks();
        setSelectedTTTask(null);
        onRefreshTasks?.();
      }
    } catch (error) {
      console.error('Failed to delete TT task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.type) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        await loadDCTasks();
        setIsCreatingTask(false);
        resetTaskForm();
        onRefreshTasks?.();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTTaskCreated = async (taskId: string) => {
    console.log('[Dashboard] TT Task created:', taskId);
    setShowTTUpload(false);
    await loadTTTasks();
    onRefreshTasks?.();
  };

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await loadUsers();
          setIsCreatingUser(false);
          resetUserForm();
        }
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtaskExpansion = (subtaskId: string) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(subtaskId)) {
      newExpanded.delete(subtaskId);
    } else {
      newExpanded.add(subtaskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      type: '',
      category: 'DC', // Default to Data Collection
      location: user?.location || 'EU',
      priority: 'medium',
      status: 'active',
      targetCar: '',
      weather: '',
      roadType: '',
      illumination: '',
      project: '',
      executionLocation: '',
      executionDetails: '',
      labels: '',
      extraSensor: '',
      datacoNumber: '',
      additionalInfo: '',
      exampleImages: ''
    });
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      role: 'viewer',
      location: 'EU',
      permissions: ['EU']
    });
  };

  const getPriorityColor = (priority: string | number) => {
    const priorityStr = typeof priority === 'number' ? (priority === 1 ? 'high' : priority === 2 ? 'medium' : 'low') : priority;
    switch (priorityStr) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'data_manager': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBackToTasks} 
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Tasks</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dc-tasks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dc-tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>DC Tasks ({dcTasks.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tt-tasks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tt-tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TestTube className="h-4 w-4" />
                  <span>TT Tasks ({ttTasks.length})</span>
                </div>
              </button>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Users ({users.length})</span>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* DC Tasks Tab */}
          {activeTab === 'dc-tasks' && (
            <div className="space-y-4">
              {/* DC Task Management Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Data Collection Tasks ({dcTasks.length})
                </h3>
                {(user?.role === 'admin' || user?.role === 'data_manager') && (
                  <Button
                    onClick={() => setIsCreatingTask(true)}
                    className="flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create DC Task</span>
                  </Button>
                )}
              </div>

              {/* Create DC Task Form */}
              {isCreatingTask && (
                <Card className="p-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-900">Create Data Collection Task</h4>
                    <p className="text-sm text-gray-600 mt-1">Create a traditional data collection task</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Task Title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Input
                      placeholder="Task Type"
                      value={taskForm.type}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value }))}
                    />
                    <select
                      value={taskForm.location}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, location: e.target.value as "EU" | "USA" | "IL" }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {user?.permissions?.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreatingTask(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTask} disabled={isLoading || !taskForm.title || !taskForm.type}>
                      <Save className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                </Card>
              )}

              {/* DC Tasks List */}
              <div className="space-y-3">
                {dcTasks.length > 0 ? (
                  dcTasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {task.status}
                            </Badge>
                            <Badge variant="outline">{task.location}</Badge>
                            <Badge variant="outline">📊 DC</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Type:</strong> {task.type} | 
                            <strong> Target:</strong> {task.targetCar || 'N/A'} | 
                            <strong> Weather:</strong> {task.weather || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(task.createdAt).toLocaleDateString()} by {task.createdBy}
                          </p>
                        </div>
                        {(user?.role === 'admin' || user?.role === 'data_manager') && (
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditDCTask(task)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDCTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No DC Tasks</h3>
                    <p className="text-gray-600 mb-4">No Data Collection tasks have been created yet.</p>
                    {(user?.role === 'admin' || user?.role === 'data_manager') && (
                      <Button onClick={() => setIsCreatingTask(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First DC Task
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TT Tasks Tab */}
          {activeTab === 'tt-tasks' && (
            <div className="space-y-4">
              {/* TT Task Management Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Test Track Tasks ({ttTasks.length})
                </h3>
                {(user?.role === 'admin' || user?.role === 'data_manager') && (
                  <Button
                    onClick={() => setShowTTUpload(true)}
                    className="flex items-center space-x-2"
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Create TT Task</span>
                  </Button>
                )}
              </div>

              {/* TT Tasks List */}
              <div className="space-y-3">
                {ttTasks.length > 0 ? (
                  ttTasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)} variant="outline">
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)} variant="outline">
                              {task.status}
                            </Badge>
                            <Badge variant="outline">{task.location}</Badge>
                            <Badge variant="outline">🏁 TT</Badge>
                            <Badge variant="outline">v{task.version}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Subtasks:</strong> {task.totalSubtasks} | 
                            <strong> Completed:</strong> {task.completedSubtasks} ({task.progress}%) | 
                            <strong> CSV:</strong> {task.csvFileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(task.createdAt).toLocaleDateString()} by {task.createdBy}
                            {task.lastEditedBy && (
                              <> • Last edited by {task.lastEditedBy}</>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Progress indicator */}
                          <div className="hidden md:block w-24">
                            <div className="text-xs text-gray-600 mb-1 text-center">
                              {task.progress}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          {(user?.role === 'admin' || user?.role === 'data_manager') && (
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" onClick={() => loadTTTaskDetails(task.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEditTTTask(task)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTTTask(task.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Subtasks View */}
                      {selectedTTTask && selectedTTTask.id === task.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="font-medium text-gray-900">
                              Subtasks ({selectedTTTask.subtasks?.length || 0})
                            </h5>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTTTask(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {selectedTTTask.subtasks && selectedTTTask.subtasks.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {selectedTTTask.subtasks.slice(0, 20).map((subtask, index) => (
                                <div key={subtask.id || index} className="border border-gray-200 rounded-lg">
                                  <div 
                                    className="p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                                    onClick={() => toggleSubtaskExpansion(subtask.id || index.toString())}
                                  >
                                    <div className="flex items-center space-x-3">
                                      {expandedSubtasks.has(subtask.id || index.toString()) ? 
                                        <ChevronDown className="h-4 w-4" /> : 
                                        <ChevronRight className="h-4 w-4" />
                                      }
                                      {getStatusIcon(subtask.status)}
                                      <span className="font-mono text-sm">{subtask.id}</span>
                                      <Badge className={getStatusColor(subtask.status)} variant="outline">
                                        {subtask.status}
                                      </Badge>
                                      <Badge className={getPriorityColor(subtask.priority || 3)} variant="outline">
                                        P{subtask.priority || 3}
                                      </Badge>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'data_manager') && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingSubtask(subtask);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>

                                  {/* Expanded Subtask Details */}
                                  {expandedSubtasks.has(subtask.id || index.toString()) && (
                                    <div className="px-3 pb-3 bg-gray-50 border-t border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                        <div><strong>Scenario:</strong> {subtask.scenario || 'N/A'}</div>
                                        <div><strong>Category:</strong> {subtask.category || 'N/A'}</div>
                                        <div><strong>Lighting:</strong> {subtask.lighting || 'N/A'}</div>
                                        <div><strong>Target Speed:</strong> {subtask.target_speed || 'N/A'} km/h</div>
                                        <div><strong>Ego Speed:</strong> {subtask.ego_speed || 'N/A'} km/h</div>
                                        <div><strong>Runs:</strong> {subtask.executedRuns || 0}/{subtask.number_of_runs || 0}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {selectedTTTask.subtasks.length > 20 && (
                                <div className="text-center text-gray-500 text-sm py-2">
                                  Showing first 20 of {selectedTTTask.subtasks.length} subtasks
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-4">
                              No subtasks available
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No TT Tasks</h3>
                    <p className="text-gray-600 mb-4">No Test Track tasks have been created yet.</p>
                    {(user?.role === 'admin' || user?.role === 'data_manager') && (
                      <Button onClick={() => setShowTTUpload(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Create First TT Task
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="space-y-4">
              {/* User Management Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Users ({users.length})
                </h3>
                <Button
                  onClick={() => setIsCreatingUser(true)}
                  className="flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </Button>
              </div>

              {/* Create User Form */}
              {isCreatingUser && (
                <Card className="p-4">
                  <div className="mb-4">
                    <h4 className="text-md font-medium text-gray-900">Create New User</h4>
                    <p className="text-sm text-gray-600 mt-1">Add a new user to the system</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Input
                      placeholder="Username"
                      value={userForm.username}
                      onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                    <Input
                      placeholder="Email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      placeholder="Password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="data_manager">Data Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      value={userForm.location}
                      onChange={(e) => setUserForm(prev => ({ ...prev, location: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EU">EU</option>
                      <option value="USA">USA</option>
                      <option value="IL">IL</option>
                    </select>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreatingUser(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isLoading || !userForm.username || !userForm.email}>
                      <Save className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </div>
                </Card>
              )}

              {/* Users List */}
              <div className="space-y-3">
                {users.map((userItem) => (
                  <Card key={userItem.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{userItem.username}</h4>
                          <Badge className={getRoleColor(userItem.role)} variant="outline">
                            {userItem.role}
                          </Badge>
                          <Badge variant="outline">{userItem.location}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Email:</strong> {userItem.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Permissions: {userItem.permissions.join(', ')} • 
                          Created: {new Date(userItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveDCTask}
        type="DC"
      />

      <EditTaskModal
        task={editingTTTask}
        isOpen={!!editingTTTask}
        onClose={() => setEditingTTTask(null)}
        onSave={handleSaveTTTask}
        type="TT"
      />

      <EditSubtaskModal
        subtask={editingSubtask}
        isOpen={!!editingSubtask}
        onClose={() => setEditingSubtask(null)}
        onSave={handleSaveSubtask}
      />

      {/* TT File Upload Modal */}
      {showTTUpload && (
        <TTFileUpload
          onClose={() => setShowTTUpload(false)}
          onTaskCreated={handleTTTaskCreated}
        />
      )}
    </div>
  );
} 