'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { TTTask, TTSubtask, DateAssignment } from '@/lib/types';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
  CalendarRange,
  Plus,
  Save,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users,
  ClipboardList,
  Eye,
  Settings,
  Target
} from 'lucide-react';

// Day Missions Modal Component with Duration Support
interface DayMissionsModalProps {
  selectedDate: Date;
  assignments: DateAssignment[];
  allSubtasks: TTSubtask[];
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  onAssignTasks?: (assignmentData: {
    assignmentType: 'single_day' | 'date_range' | 'duration_days';
    date?: string;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
    subtaskIds: string[];
    notes?: string;
    title?: string;
    overrideConflicts?: boolean;
  }) => void;
  onRemoveAssignment?: (assignmentId: string, subtaskId: string) => void;
}

function DayMissionsModal({ 
  selectedDate, 
  assignments, 
  allSubtasks, 
  isOpen, 
  onClose, 
  canManage,
  onAssignTasks,
  onRemoveAssignment 
}: DayMissionsModalProps) {
  const [selectedSubtasks, setSelectedSubtasks] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAlreadyAssigned, setShowAlreadyAssigned] = useState(false);
  
  // New duration assignment states
  const [assignmentType, setAssignmentType] = useState<'single_day' | 'date_range' | 'duration_days'>('single_day');
  const [startDate, setStartDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(1);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  
  const dateString = selectedDate.toISOString().split('T')[0];
  
  // Get assignments that cover the selected date
  const relevantAssignments = assignments.filter(assignment => {
    const assignmentDates = getAssignmentDates(assignment);
    return assignmentDates.includes(dateString);
  });
  
  const assignedSubtaskIds = relevantAssignments.flatMap(a => a.subtaskIds);
  const assignedSubtasks = allSubtasks.filter(s => assignedSubtaskIds.includes(s.id));

  // Helper function to get assignment dates from DateAssignment
  const getAssignmentDates = (assignment: DateAssignment): string[] => {
    switch (assignment.assignmentType) {
      case 'single_day':
        return assignment.date ? [assignment.date] : [];
      case 'date_range':
        if (assignment.startDate && assignment.endDate) {
          return getDateRange(assignment.startDate, assignment.endDate);
        }
        return [];
      case 'duration_days':
        if (assignment.startDate && assignment.durationDays) {
          return getDateRangeFromDuration(assignment.startDate, assignment.durationDays);
        }
        return [];
      default:
        return [];
    }
  };

  // Helper function to generate date range
  const getDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Helper function to generate dates from duration
  const getDateRangeFromDuration = (start: string, duration: number): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    
    for (let i = 0; i < duration; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      dates.push(current.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  // Get preview of assignment dates
  const getAssignmentPreviewDates = (): string[] => {
    switch (assignmentType) {
      case 'single_day':
        return [startDate];
      case 'date_range':
        return getDateRange(startDate, endDate);
      case 'duration_days':
        return getDateRangeFromDuration(startDate, durationDays);
      default:
        return [];
    }
  };
  
  // Get available and already assigned subtasks for assignment modal
  const availableSubtasks = allSubtasks.filter(s => 
    !assignedSubtaskIds.includes(s.id) && 
    !(s.isExecuted || s.status === 'completed') // Exclude completed tasks
  );
  
  const alreadyAssignedSubtasks = allSubtasks.filter(s => 
    !assignedSubtaskIds.includes(s.id) && 
    s.assignedDate && 
    s.assignedDate !== dateString &&
    !(s.isExecuted || s.status === 'completed') // Exclude completed tasks
  );
  
  // Group subtasks by scenario for assignment modal
  const groupSubtasksByScenario = (subtasks: TTSubtask[]) => {
    return subtasks.reduce((groups, subtask) => {
      const scenario = subtask.scenario;
      if (!groups[scenario]) {
        groups[scenario] = [];
      }
      groups[scenario].push(subtask);
      return groups;
    }, {} as Record<string, TTSubtask[]>);
  };
  
  const availableByScenario = groupSubtasksByScenario(availableSubtasks);
  const alreadyAssignedByScenario = groupSubtasksByScenario(alreadyAssignedSubtasks);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getExecutionStatusColor = (subtask: TTSubtask) => {
    if (subtask.isExecuted) return 'bg-green-100 text-green-800';
    if (subtask.assignedDate) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-600';
  };

  const getExecutionStatusText = (subtask: TTSubtask) => {
    if (subtask.isExecuted) return 'Executed';
    if (subtask.assignedDate) return 'Assigned';
    return 'Not Assigned';
  };

  const handleAssignTasks = () => {
    if (onAssignTasks && selectedSubtasks.length > 0) {
      const assignmentData = {
        assignmentType,
        date: assignmentType === 'single_day' ? startDate : undefined,
        startDate: assignmentType !== 'single_day' ? startDate : undefined,
        endDate: assignmentType === 'date_range' ? endDate : undefined,
        durationDays: assignmentType === 'duration_days' ? durationDays : undefined,
        subtaskIds: selectedSubtasks,
        notes: assignmentNotes,
        title: assignmentTitle
      };
      
      try {
        onAssignTasks(assignmentData);
        setSelectedSubtasks([]);
        setAssignmentNotes('');
        setAssignmentTitle('');
        setShowAssignModal(false);
      } catch (error: any) {
        if (error.conflicts) {
          setConflicts(error.conflicts);
          setShowConflictDialog(true);
        }
      }
    }
  };

  const handleSelectSubtask = (subtaskId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubtasks(prev => [...prev, subtaskId]);
    } else {
      setSelectedSubtasks(prev => prev.filter(id => id !== subtaskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubtasks(availableSubtasks.map(s => s.id));
    } else {
      setSelectedSubtasks([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Day Missions</h2>
              <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canManage && (
              <Button 
                onClick={() => setShowAssignModal(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Tasks
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Assigned Tasks */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Assigned Tasks ({assignedSubtasks.length})
              </h3>
            </div>
            
            {assignedSubtasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignedSubtasks.map((subtask) => (
                  <div key={subtask.id} className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {subtask.isExecuted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            getStatusIcon(subtask.status)
                          )}
                          <div className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded truncate">
                            {subtask.jira_subtask_number || subtask.id}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 mb-1 font-medium truncate">
                          {subtask.scenario}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {subtask.category}
                          </Badge>
                          <span>•</span>
                          <span>P{subtask.priority}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Badge variant="outline" className={`text-xs px-2 py-0 ${getExecutionStatusColor(subtask)}`}>
                            {getExecutionStatusText(subtask)}
                          </Badge>
                        </div>
                      </div>
                      {canManage && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            // Find the assignment for this subtask
                            const assignment = assignments.find(a => a.subtaskIds.includes(subtask.id));
                            if (assignment) {
                              onRemoveAssignment?.(assignment.id, subtask.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No tasks assigned for this date</p>
                {canManage && (
                  <Button 
                    onClick={() => setShowAssignModal(true)} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Assign Tasks
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Task Assignment Modal */}
        {showAssignModal && canManage && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAssignModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Assign Tasks</h3>
                
                {/* Assignment Type Selection */}
                <div className="mt-4 mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Assignment Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('single_day')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'single_day' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Single Day</span>
                      </div>
                      <p className="text-xs text-gray-600">Assign to one specific date</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAssignmentType('date_range')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'date_range' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <CalendarRange className="h-4 w-4" />
                        <span className="font-medium">Date Range</span>
                      </div>
                      <p className="text-xs text-gray-600">Set start and end dates</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAssignmentType('duration_days')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'duration_days' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <CalendarDays className="h-4 w-4" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p className="text-xs text-gray-600">Start date + number of days</p>
                    </button>
                  </div>
                </div>

                {/* Date Configuration */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Date Configuration</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignmentType === 'single_day' && (
                      <div>
                        <Label htmlFor="single-date" className="text-sm text-gray-600">Date</Label>
                        <Input
                          id="single-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                    
                    {assignmentType === 'date_range' && (
                      <>
                        <div>
                          <Label htmlFor="start-date" className="text-sm text-gray-600">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-sm text-gray-600">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                    
                    {assignmentType === 'duration_days' && (
                      <>
                        <div>
                          <Label htmlFor="start-date-duration" className="text-sm text-gray-600">Start Date</Label>
                          <Input
                            id="start-date-duration"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration" className="text-sm text-gray-600">Duration (Days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="365"
                            value={durationDays}
                            onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Assignment Preview */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Assignment Preview</div>
                    <div className="text-sm text-blue-700">
                      {getAssignmentPreviewDates().length > 0 ? (
                        <>
                          <div>Dates: {getAssignmentPreviewDates().join(', ')}</div>
                          <div className="mt-1">Duration: {getAssignmentPreviewDates().length} day{getAssignmentPreviewDates().length !== 1 ? 's' : ''}</div>
                        </>
                      ) : (
                        'Please configure the assignment dates above'
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-2">
                  <button
                    onClick={() => setShowAlreadyAssigned(false)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      !showAlreadyAssigned 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Available ({availableSubtasks.length})
                  </button>
                  <button
                    onClick={() => setShowAlreadyAssigned(true)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      showAlreadyAssigned 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Already Assigned ({alreadyAssignedSubtasks.length})
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {!showAlreadyAssigned ? (
                  <>
                    {/* Available Tasks */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          checked={selectedSubtasks.length === availableSubtasks.length && availableSubtasks.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubtasks(availableSubtasks.map(s => s.id));
                            } else {
                              setSelectedSubtasks([]);
                            }
                          }}
                        />
                        <Label className="text-sm font-medium">
                          Select All Available ({availableSubtasks.length} tasks)
                        </Label>
                      </div>
                    </div>

                    {/* Available scenarios */}
                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                      {Object.entries(availableByScenario).map(([scenario, scenarioSubtasks]) => (
                        <div key={scenario} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              checked={scenarioSubtasks.every(s => selectedSubtasks.includes(s.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubtasks(prev => [...new Set([...prev, ...scenarioSubtasks.map(s => s.id)])]);
                                } else {
                                  setSelectedSubtasks(prev => prev.filter(id => !scenarioSubtasks.some(s => s.id === id)));
                                }
                              }}
                            />
                            <Label className="font-medium text-gray-900">
                              {scenario} ({scenarioSubtasks.length} tasks)
                            </Label>
                          </div>
                          <div className="ml-6 space-y-1">
                            {scenarioSubtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={selectedSubtasks.includes(subtask.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubtasks(prev => [...prev, subtask.id]);
                                    } else {
                                      setSelectedSubtasks(prev => prev.filter(id => id !== subtask.id));
                                    }
                                  }}
                                />
                                <span className="font-mono text-blue-600 font-medium">
                                  {subtask.jira_subtask_number || subtask.id}
                                </span>
                                <span className="text-gray-600">•</span>
                                <Badge variant="outline" className="text-xs">{subtask.category}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Already Assigned Tasks */}
                    <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                      {Object.entries(alreadyAssignedByScenario).map(([scenario, scenarioSubtasks]) => (
                        <div key={scenario} className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              checked={scenarioSubtasks.every(s => selectedSubtasks.includes(s.id))}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSubtasks(prev => [...new Set([...prev, ...scenarioSubtasks.map(s => s.id)])]);
                                } else {
                                  setSelectedSubtasks(prev => prev.filter(id => !scenarioSubtasks.some(s => s.id === id)));
                                }
                              }}
                            />
                            <Label className="font-medium text-amber-900">
                              {scenario} ({scenarioSubtasks.length} tasks)
                            </Label>
                          </div>
                          <div className="ml-6 space-y-1">
                            {scenarioSubtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                                <Checkbox
                                  checked={selectedSubtasks.includes(subtask.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubtasks(prev => [...prev, subtask.id]);
                                    } else {
                                      setSelectedSubtasks(prev => prev.filter(id => id !== subtask.id));
                                    }
                                  }}
                                />
                                <span className="font-mono text-blue-600 font-medium">
                                  {subtask.jira_subtask_number || subtask.id}
                                </span>
                                <span className="text-amber-600">•</span>
                                <Badge variant="outline" className="text-xs">{subtask.category}</Badge>
                                <span className="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded">
                                  📅 {new Date(subtask.assignedDate!).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Notes section */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Assignment Title (Optional)</Label>
                  <Input
                    id="title"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="Add a title for this assignment..."
                    className="text-sm"
                  />
                </div>

                {/* Notes section */}
                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Add any notes for this assignment..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignTasks}
                  disabled={selectedSubtasks.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Assign ({selectedSubtasks.length})
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Timeline/Calendar Component
interface TimelineCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  view: 'carousel' | 'week' | 'month';
  onViewChange: (view: 'carousel' | 'week' | 'month') => void;
  assignments: DateAssignment[];
  subtasks: TTSubtask[];
  onDateClick: (date: Date) => void;
}

function TimelineCalendar({ 
  selectedDate, 
  onDateSelect, 
  view, 
  onViewChange, 
  assignments,
  subtasks,
  onDateClick 
}: TimelineCalendarProps) {
  const today = new Date();
  
  const getDateAssignmentInfo = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Find all assignments that cover this date
    const relevantAssignments = assignments.filter(assignment => {
      switch (assignment.assignmentType) {
        case 'single_day':
          return assignment.date === dateString;
        case 'date_range':
          if (assignment.startDate && assignment.endDate) {
            return dateString >= assignment.startDate && dateString <= assignment.endDate;
          }
          return false;
        case 'duration_days':
          if (assignment.startDate && assignment.durationDays) {
            const startDate = new Date(assignment.startDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + assignment.durationDays - 1);
            const endDateString = endDate.toISOString().split('T')[0];
            return dateString >= assignment.startDate && dateString <= endDateString;
          }
          return false;
        default:
          // Fallback for legacy assignments
          return assignment.date === dateString;
      }
    });

    // Get all subtasks assigned to this date
    const assignedSubtaskIds = relevantAssignments.flatMap(a => a.subtaskIds);
    const assignedSubtasks = subtasks.filter(s => assignedSubtaskIds.includes(s.id));
    
    const totalAssigned = assignedSubtasks.length;
    const completed = assignedSubtasks.filter(s => s.isExecuted || s.status === 'completed').length;
    const inProgress = assignedSubtasks.filter(s => s.status === 'in_progress').length;
    const failed = assignedSubtasks.filter(s => s.status === 'failed').length;
    
    // Determine overall status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    let dayStatus: 'no_tasks' | 'pending_future' | 'pending_past' | 'partial' | 'completed' = 'no_tasks';
    
    if (totalAssigned === 0) {
      dayStatus = 'no_tasks';
    } else if (completed === totalAssigned) {
      dayStatus = 'completed';
    } else if (completed > 0 || inProgress > 0) {
      dayStatus = 'partial';
    } else if (dateObj > today) {
      dayStatus = 'pending_future';
    } else {
      dayStatus = 'pending_past';
    }

    // Check if this date is part of a multi-day assignment
    const multiDayAssignments = relevantAssignments.filter(assignment => {
      switch (assignment.assignmentType) {
        case 'date_range':
          return assignment.startDate && assignment.endDate && assignment.startDate !== assignment.endDate;
        case 'duration_days':
          return assignment.durationDays && assignment.durationDays > 1;
        default:
          return false;
      }
    });

    // Calculate position in multi-day assignments
    const multiDayInfo = multiDayAssignments.map(assignment => {
      let startDate = '';
      let totalDays = 1;
      let currentDayIndex = 0;

      switch (assignment.assignmentType) {
        case 'date_range':
          if (assignment.startDate && assignment.endDate) {
            startDate = assignment.startDate;
            const start = new Date(assignment.startDate);
            const end = new Date(assignment.endDate);
            totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const current = new Date(dateString);
            currentDayIndex = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
        case 'duration_days':
          if (assignment.startDate && assignment.durationDays) {
            startDate = assignment.startDate;
            totalDays = assignment.durationDays;
            const start = new Date(assignment.startDate);
            const current = new Date(dateString);
            currentDayIndex = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }
          break;
      }

      return {
        assignmentId: assignment.id,
        title: assignment.title || `Assignment ${assignment.id.slice(-6)}`,
        isStart: currentDayIndex === 0,
        isEnd: currentDayIndex === totalDays - 1,
        isMiddle: currentDayIndex > 0 && currentDayIndex < totalDays - 1,
        totalDays,
        currentDay: currentDayIndex + 1,
        progress: totalDays > 0 ? ((currentDayIndex + 1) / totalDays) * 100 : 0
      };
    });
    
    return { 
      totalAssigned, 
      completed, 
      inProgress, 
      failed,
      dayStatus,
      hasAssignments: totalAssigned > 0,
      relevantAssignments,
      multiDayInfo
    };
  };
  
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
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
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
    
    startDate.setDate(firstDay.getDate() - (startDay === 0 ? 6 : startDay - 1));
    
    const days = [];
    const totalCells = 42;
    
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

  const renderDateButton = (date: Date, className: string) => {
    const assignmentInfo = getDateAssignmentInfo(date);
    
    // Enhanced styling for today
    const isSelectedDate = isSelected(date);
    const isTodayDate = isToday(date);
    
    // Fixed base styling for consistent sizing
    let baseClass = 'relative transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 overflow-hidden';
    let dateClass = '';
    let textClass = '';
    let borderClass = '';
    let bgClass = '';
    
    // Today styling - minimal border approach
    if (isTodayDate) {
      borderClass = 'ring-2 ring-blue-600 ring-inset shadow-lg';
      bgClass = 'bg-white border-2 border-blue-600';
      textClass = 'text-blue-900 font-bold';
      dateClass = 'shadow-md';
    }
    // Selected styling - secondary prominence
    else if (isSelectedDate) {
      borderClass = 'ring-1 ring-blue-400 ring-inset';
      bgClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300';
      textClass = 'text-blue-900 font-semibold';
      dateClass = 'shadow-sm';
    }
    // Assignment status styling
    else {
      switch (assignmentInfo.dayStatus) {
        case 'completed':
          bgClass = 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200';
          textClass = 'text-emerald-900';
          borderClass = 'hover:ring-1 hover:ring-emerald-300';
          break;
        case 'partial':
          bgClass = 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200';
          textClass = 'text-sky-900';
          borderClass = 'hover:ring-1 hover:ring-sky-300';
          break;
        case 'pending_future':
          bgClass = 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200';
          textClass = 'text-amber-900';
          borderClass = 'hover:ring-1 hover:ring-amber-300';
          break;
        case 'pending_past':
          bgClass = 'bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200';
          textClass = 'text-rose-900';
          borderClass = 'hover:ring-1 hover:ring-rose-300';
          break;
        default:
          bgClass = 'bg-white border border-gray-200';
          textClass = 'text-gray-700';
          borderClass = 'hover:border-gray-300 hover:shadow-sm';
      }
    }
    
    return (
      <button
        key={date.toISOString()}
        onClick={() => {
          onDateSelect(date);
          onDateClick(date);
        }}
        className={`${className} ${baseClass} ${bgClass} ${borderClass} ${dateClass}`}
        title={getDateTooltip(assignmentInfo, date)}
      >
        <div className="text-center p-3 flex flex-col items-center justify-center h-full">
          {/* Day label for carousel view */}
          {view === 'carousel' && (
            <div className={`text-xs font-medium mb-1 ${textClass.replace('font-bold', 'font-medium').replace('font-semibold', 'font-medium')}`}>
              {formatDate(date, 'day')}
            </div>
          )}
          
          {/* Date number - main focus */}
          <div className={`${isTodayDate ? 'text-xl font-black' : isSelectedDate ? 'text-lg font-bold' : 'text-lg font-semibold'} ${textClass}`}>
            {formatDate(date, 'dayNum')}
          </div>
          
          {/* Today indicator */}
          {isTodayDate && (
            <div className="text-xs font-bold text-blue-600 mt-1 px-2 py-0.5 bg-blue-100 rounded-full">
              Today
            </div>
          )}
        </div>
        
        {/* Enhanced assignment indicators */}
        {assignmentInfo.hasAssignments && (
          <div className="absolute top-1 right-1">
            <div className="relative">
              {/* Status indicator */}
              <div className="w-3 h-3 rounded-full shadow-sm border border-white">
                {assignmentInfo.dayStatus === 'completed' && (
                  <div className="w-full h-full bg-emerald-500 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'partial' && (
                  <div className="w-full h-full bg-sky-500 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'pending_future' && (
                  <div className="w-full h-full bg-amber-400 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'pending_past' && (
                  <div className="w-full h-full bg-rose-500 rounded-full"></div>
                )}
              </div>
              
              {/* Task count badge */}
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm px-1">
                {assignmentInfo.totalAssigned}
              </div>
            </div>
          </div>
        )}

        {/* Multi-day assignment indicators */}
        {assignmentInfo.multiDayInfo && assignmentInfo.multiDayInfo.length > 0 && (
          <div className="absolute bottom-1 left-1 right-1">
            {assignmentInfo.multiDayInfo.map((multiDay, index) => (
              <div key={multiDay.assignmentId} className="mb-1">
                {/* Connection line for multi-day assignments */}
                <div className="flex items-center h-2">
                  {/* Start indicator */}
                  {multiDay.isStart && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                  
                  {/* Progress bar */}
                  <div className="flex-1 h-1 mx-1 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${multiDay.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* End indicator */}
                  {multiDay.isEnd && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                {/* Day indicator */}
                <div className="text-xs text-blue-700 font-bold text-center">
                  {multiDay.currentDay}/{multiDay.totalDays}
                </div>
              </div>
            ))}
          </div>
        )}
      </button>
    );
  };

  // Helper function for date tooltips with duration support
  const getDateTooltip = (assignmentInfo: any, date: Date) => {
    const dateStr = date.toLocaleDateString();
    
    if (!assignmentInfo.hasAssignments) {
      return `${dateStr} - No tasks assigned`;
    }
    
    const { totalAssigned, completed, inProgress, failed, dayStatus, multiDayInfo } = assignmentInfo;
    
    let statusText = '';
    switch (dayStatus) {
      case 'completed':
        statusText = 'All tasks completed';
        break;
      case 'partial':
        statusText = `${completed} completed, ${inProgress} in progress`;
        break;
      case 'pending_future':
        statusText = 'Tasks scheduled (future)';
        break;
      case 'pending_past':
        statusText = 'Tasks overdue';
        break;
    }
    
    let tooltip = `${dateStr} - ${totalAssigned} tasks assigned\n${statusText}`;
    
    if (failed > 0) {
      tooltip += `\n${failed} failed`;
    }
    
    // Add multi-day assignment information
    if (multiDayInfo && multiDayInfo.length > 0) {
      tooltip += '\n\nMulti-day assignments:';
      multiDayInfo.forEach((multiDay: any) => {
        tooltip += `\n• ${multiDay.title}: Day ${multiDay.currentDay}/${multiDay.totalDays}`;
      });
    }
    
    return tooltip;
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      {/* View Switcher */}
      <div className="flex items-center justify-center mb-6 px-6 pt-6">
        <div className="flex bg-gray-50 rounded-lg p-1 gap-1">
          <Button
            variant={view === 'carousel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('carousel')}
            className={`h-8 px-4 rounded-md transition-all ${
              view === 'carousel' 
                ? 'bg-white shadow-sm border-0 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-100 text-gray-600 border-0'
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
                ? 'bg-white shadow-sm border-0 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-100 text-gray-600 border-0'
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
                ? 'bg-white shadow-sm border-0 text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-100 text-gray-600 border-0'
            }`}
          >
            <Grid3X3 className="h-3 w-3 mr-2" />
            Month
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
          {view === 'month' && (
            <span className="text-gray-600">{formatDate(selectedDate, 'month')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Simplified Legend */}
          <div className="hidden sm:flex items-center space-x-3 text-xs text-gray-500 mr-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span>Overdue</span>
            </div>
          </div>
          
          {/* Navigation */}
          <Button variant="ghost" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDateSelect(new Date())}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="px-6 pb-6">
        {view === 'carousel' && (
          <div className="flex space-x-3 overflow-x-auto pb-2 px-1">
            {generateCarouselDays().map((date, index) => {
              const baseClass = `flex-shrink-0 w-20 h-24 rounded-xl transition-all hover:scale-105 cursor-pointer`;
              return renderDateButton(date, baseClass);
            })}
          </div>
        )}

        {view === 'week' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Clean week grid */}
            <div className="space-y-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-semibold text-gray-600 py-3 border-r border-gray-100 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Week days */}
              <div className="grid grid-cols-7">
                {generateWeekDays().map((date, index) => {
                  const baseClass = `h-20 relative cursor-pointer transition-all duration-200 border-r border-gray-100 last:border-r-0`;
                  return renderDateButton(date, baseClass);
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Clean month grid */}
            <div className="space-y-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-semibold text-gray-600 py-3 border-r border-gray-100 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days - Fixed height grid */}
              <div className="grid grid-cols-7">
                {generateMonthDays().map((date, index) => {
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);
                  const isCurrentMonthDate = isCurrentMonth(date);
                  const assignmentInfo = getDateAssignmentInfo(date);
                  
                  // Fixed sizing approach with modern styling
                  let dayClass = 'h-16 relative cursor-pointer transition-all duration-200 border-r border-b border-gray-100 last:border-r-0 hover:bg-gray-50 flex flex-col items-center justify-center';
                  let textClass = 'text-sm font-medium text-gray-700';
                  let dateNumClass = 'text-sm font-semibold';
                  
                  // Today styling - minimal border approach
                  if (isTodayDate) {
                    dayClass = dayClass.replace('hover:bg-gray-50', 'hover:bg-blue-50');
                    dayClass += ' ring-2 ring-inset ring-blue-600 bg-blue-50';
                    textClass = 'text-blue-900 font-bold';
                    dateNumClass = 'text-blue-900 font-black';
                  }
                  // Selected styling - subtle
                  else if (isSelectedDate) {
                    dayClass = dayClass.replace('hover:bg-gray-50', 'hover:bg-blue-50');
                    dayClass += ' bg-blue-50 ring-1 ring-inset ring-blue-300';
                    textClass = 'text-blue-700 font-semibold';
                    dateNumClass = 'text-blue-700 font-bold';
                  }
                  // Other month dates - muted
                  else if (!isCurrentMonthDate) {
                    textClass = 'text-gray-400';
                    dateNumClass = 'text-gray-400';
                    dayClass = dayClass.replace('hover:bg-gray-50', 'hover:bg-gray-25');
                  }
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        onDateSelect(date);
                        onDateClick(date);
                      }}
                      className={dayClass}
                      title={getDateTooltip(assignmentInfo, date)}
                    >
                      {/* Date number */}
                      <div className={`${dateNumClass} mb-1`}>
                        {formatDate(date, 'dayNum')}
                      </div>
                      
                      {/* Today badge */}
                      {isTodayDate && (
                        <div className="text-xs font-bold text-blue-600 px-1.5 py-0.5 bg-blue-100 rounded-full">
                          Today
                        </div>
                      )}
                      
                      {/* Assignment indicator - minimal dot */}
                      {assignmentInfo.hasAssignments && (
                        <div className="absolute bottom-1 right-1 flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            assignmentInfo.dayStatus === 'completed' ? 'bg-emerald-500' :
                            assignmentInfo.dayStatus === 'partial' ? 'bg-sky-500' :
                            assignmentInfo.dayStatus === 'pending_future' ? 'bg-amber-400' :
                            assignmentInfo.dayStatus === 'pending_past' ? 'bg-rose-500' : 'bg-gray-400'
                          }`}></div>
                          <div className={`text-xs font-bold min-w-[16px] text-center ${
                            isTodayDate ? 'text-blue-700' : 
                            isSelectedDate ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {assignmentInfo.totalAssigned}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Selected date info */}
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500">
            Selected: {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
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

function ScenarioGroupRow({ scenario, subtasks, isExpanded, onToggle, onEditSubtask, onSelectSubtask }: ScenarioGroupProps & { onSelectSubtask?: (subtask: TTSubtask) => void }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusDot = (status: string, isExecuted: boolean = false) => {
    if (isExecuted) return 'bg-green-500';
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusColor = (status: string, isExecuted: boolean = false) => {
    if (isExecuted) return 'bg-green-100 text-green-800';
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

  const completedCount = subtasks.filter(s => s.isExecuted || s.status === 'completed').length;
  const inProgressCount = subtasks.filter(s => s.status === 'in_progress' && !s.isExecuted).length;
  const pausedCount = subtasks.filter(s => s.status === 'paused' && !s.isExecuted).length;
  const pendingCount = subtasks.filter(s => s.status === 'pending' && !s.isExecuted).length;
  const assignedCount = subtasks.filter(s => s.assignedDate || s.assignmentId).length;

  // Get dominant status - prioritize executed tasks
  const hasExecuted = subtasks.some(s => s.isExecuted);
  let dominantStatus = 'pending';
  if (completedCount === subtasks.length) {
    dominantStatus = 'completed';
  } else if (completedCount > 0 || inProgressCount > 0) {
    dominantStatus = inProgressCount > completedCount ? 'in_progress' : 'completed';
  }

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
                <div className={`w-3 h-3 rounded-full ${getStatusDot(dominantStatus, hasExecuted)}`}></div>
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
                  <span className="text-blue-600 font-medium">{assignedCount}/{subtasks.length} assigned</span>
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
                <Badge variant="outline" className={`text-xs ${getStatusColor(dominantStatus, hasExecuted)}`}>
                  {hasExecuted && completedCount > 0 ? 'executed' : dominantStatus.replace('_', ' ')}
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
  const getStatusIcon = (status: string, isExecuted: boolean = false) => {
    if (isExecuted) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    switch (status) {
      case 'completed': return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusDot = (status: string, isExecuted: boolean = false) => {
    if (isExecuted) return 'bg-green-500';
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusColor = (status: string, isExecuted: boolean = false) => {
    if (isExecuted) return 'bg-green-100 text-green-800';
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
          <div className={`w-2 h-2 rounded-full ${getStatusDot(subtask.status, subtask.isExecuted)} flex-shrink-0`}></div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm text-gray-900 truncate">
                {subtask.scenario || 'Unknown Scenario'}
              </span>
              <span className="font-mono text-xs text-blue-600 flex-shrink-0 font-bold">
                {subtask.jira_subtask_number || `#${subtask.id}`}
              </span>
              {subtask.isExecuted && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                  ✓ Executed
                </span>
              )}
              {(subtask.assignedDate || subtask.assignmentId) && !subtask.isExecuted && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                  📅 {subtask.assignedDate ? new Date(subtask.assignedDate).toLocaleDateString() : 'Assigned'}
                </span>
              )}
            </div>
            
            {/* Additional info on mobile */}
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-600 sm:hidden">
              <Badge variant="outline" className={`text-xs ${getStatusColor(subtask.status, subtask.isExecuted)}`}>
                {subtask.isExecuted ? 'executed' : subtask.status}
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
            <Badge variant="outline" className={`text-xs ${getStatusColor(subtask.status, subtask.isExecuted)}`}>
              {subtask.isExecuted ? 'executed' : subtask.status}
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
                className={`h-1.5 rounded-full transition-all duration-300 ${subtask.isExecuted ? 'bg-green-600' : 'bg-blue-600'}`}
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

// Enhanced Subtask Detail Modal Component
interface SubtaskDetailModalProps {
  subtask: TTSubtask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (subtask: TTSubtask) => void;
  canEdit?: boolean;
}

function SubtaskDetailModal({ subtask, isOpen, onClose, onEdit, canEdit }: SubtaskDetailModalProps) {
  if (!isOpen || !subtask) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Play className="h-5 w-5 text-blue-600" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    switch (priorityNum) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string | number) => {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    switch (priorityNum) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return `Priority ${priority}`;
    }
  };

  const getExecutionProgress = () => {
    const total = parseInt(subtask.number_of_runs) || 0;
    const executed = subtask.executedRuns || 0;
    return total > 0 ? Math.round((executed / total) * 100) : 0;
  };

  const executionProgress = getExecutionProgress();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex-1 mr-4">
            <div className="flex items-center space-x-3 mb-3">
              {getStatusIcon(subtask.status)}
              <h2 className="text-2xl font-bold text-gray-900">{subtask.scenario}</h2>
              <Badge variant="outline" className={`${getStatusColor(subtask.status)} font-medium`}>
                {subtask.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span className="font-medium">{subtask.jira_subtask_number || subtask.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {subtask.category}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={`${getPriorityColor(subtask.priority)} text-xs`}>
                  {getPriorityLabel(subtask.priority)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && onEdit && (
              <Button onClick={() => onEdit(subtask)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Scenario Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TestTube className="h-5 w-5 mr-2 text-blue-600" />
                  Scenario Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Regulation:</span>
                      <span className="text-sm text-gray-900">{subtask.regulation}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Lighting:</span>
                      <Badge variant="outline" className="text-xs">{subtask.lighting}</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Street Lights:</span>
                      <span className="text-sm text-gray-900">{subtask.street_lights}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Beam:</span>
                      <span className="text-sm text-gray-900">{subtask.beam}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Target Speed:</span>
                      <Badge variant="outline" className="text-xs">{subtask.target_speed} km/h</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Ego Speed:</span>
                      <Badge variant="outline" className="text-xs">{subtask.ego_speed} km/h</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Overlap:</span>
                      <span className="text-sm text-gray-900">{subtask.overlap}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-700">Headway:</span>
                      <span className="text-sm text-gray-900">{subtask.headway}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Progress */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-green-600" />
                  Execution Progress
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-lg font-bold text-gray-900">{executionProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${executionProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Brake:</span>
                    <span className="text-sm text-gray-900">{subtask.brake}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Version:</span>
                    <Badge variant="outline" className="text-xs">v{subtask.version}</Badge>
                  </div>
                </div>
                {subtask.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Notes</h4>
                    <p className="text-sm text-yellow-700">{subtask.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Status & Timeline */}
            <div className="space-y-6">
              {/* Execution Status */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Execution Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Current Status</span>
                    <Badge variant="outline" className={getStatusColor(subtask.status)}>
                      {subtask.status}
                    </Badge>
                  </div>
                  {subtask.isExecuted && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Executed</span>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                  {subtask.assignedDate && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Assigned Date</span>
                      <span className="text-sm text-blue-700">
                        {new Date(subtask.assignedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="text-gray-600">
                      {new Date(subtask.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="text-gray-600">
                      {new Date(subtask.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {subtask.lastEditedBy && (
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-gray-700">Last Edited By:</span>
                      <Badge variant="outline" className="text-xs">
                        {subtask.lastEditedBy}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');
  const [selectedSubtask, setSelectedSubtask] = useState<TTSubtask | null>(null);
  
  // Timeline state - Start with today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineView, setTimelineView] = useState<'carousel' | 'week' | 'month'>('month');
  const [showDayMissions, setShowDayMissions] = useState(false);

  const taskId = params.id as string;

  // User permission checks
  const canManage = user?.role === 'admin' || user?.role === 'data_manager';
  const canEdit = canManage;

  useEffect(() => {
    if (user && token && taskId) {
      fetchTask();
      fetchTaskCounts();
    }
  }, [user, token, taskId]);

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tasks/tt/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTask(data.data);
        } else {
          setError(data.error || 'Failed to load task');
        }
      } else {
        setError('Failed to load task');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskCounts = async () => {
    try {
      const response = await fetch('/api/tasks/counts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTaskCounts(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching task counts:', error);
    }
  };

  const handleSectionChange = (section: 'DC' | 'TT' | 'management') => {
    if (section === 'DC') {
      router.push('/?section=DC');
    } else if (section === 'TT') {
      router.push('/?section=TT');
    } else if (section === 'management') {
      router.push('/dashboard');
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayMissions(true);
  };

  const handleAssignTasks = async (assignmentData: {
    assignmentType: 'single_day' | 'date_range' | 'duration_days';
    date?: string;
    startDate?: string;
    endDate?: string;
    durationDays?: number;
    subtaskIds: string[];
    notes?: string;
    title?: string;
    overrideConflicts?: boolean;
  }) => {
    if (!task || !canManage) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${taskId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchTask(); // Refresh task data
      } else if (response.status === 409 && data.requiresConfirmation) {
        // Handle conflicts - throw with conflict data to be caught by modal
        throw { conflicts: data.conflicts };
      } else {
        alert('Failed to assign tasks: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      if (error.conflicts) {
        // Re-throw for modal to handle
        throw error;
      } else {
        console.error('Error assigning tasks:', error);
        alert('Failed to assign tasks');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, subtaskId: string) => {
    if (!task || !canManage) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${taskId}/assignments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId,
          subtaskId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchTask(); // Refresh task data
        } else {
          alert('Failed to remove assignment: ' + data.error);
        }
      } else {
        alert('Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter subtasks based on search and filters
  const filteredSubtasks = task?.subtasks.filter(subtask => {
    const matchesSearch = searchTerm === '' || 
      subtask.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subtask.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subtask.jira_subtask_number && subtask.jira_subtask_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || subtask.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || subtask.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || subtask.category === categoryFilter;
    
    // Assignment status filter
    const matchesAssignment = assignmentFilter === 'all' || 
      (assignmentFilter === 'assigned' && subtask.assignedDate) ||
      (assignmentFilter === 'not_assigned' && !subtask.assignedDate) ||
      (assignmentFilter === 'past_due' && subtask.assignedDate && new Date(subtask.assignedDate) < new Date() && !subtask.isExecuted);
    
    // Completion status filter  
    const matchesCompletion = completionFilter === 'all' ||
      (completionFilter === 'completed' && (subtask.isExecuted || subtask.status === 'completed')) ||
      (completionFilter === 'not_completed' && !(subtask.isExecuted || subtask.status === 'completed'));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignment && matchesCompletion;
  }) || [];

  // Group subtasks by scenario
  const scenarioGroups = filteredSubtasks.reduce((groups, subtask) => {
    const scenario = subtask.scenario;
    if (!groups[scenario]) {
      groups[scenario] = [];
    }
    groups[scenario].push(subtask);
    return groups;
  }, {} as Record<string, TTSubtask[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        taskCounts={taskCounts}
      />

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading task...</p>
            </div>
          </div>
        ) : task ? (
          <div className="space-y-6">
            {/* Task Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push('/?section=TT')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to TT Tasks
                    </Button>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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

                <div className="flex items-center space-x-3">
                  <Badge className={getPriorityColor(task.priority)} variant="outline">
                    {task.priority}
                  </Badge>
                  <Badge className={getStatusColor(task.status)} variant="outline">
                    {task.status}
                  </Badge>
                  <Badge variant="outline">🏁 TT</Badge>
                  <Badge variant="outline">v{task.version}</Badge>
                </div>
              </div>

              {task.description && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{task.description}</p>
                </div>
              )}

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-700 mb-1">Total Subtasks</div>
                  <div className="text-2xl font-bold text-blue-900">{task.totalSubtasks}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700 mb-1">Completed</div>
                  <div className="text-2xl font-bold text-green-900">
                    {task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-700 mb-1">Progress</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round((task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length / task.totalSubtasks) * 100)}%
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-orange-700 mb-1">CSV File</div>
                  <div className="text-sm font-medium text-orange-900 truncate">{task.csvFileName}</div>
                </div>
              </div>
            </div>

            {/* Enhanced Timeline */}
            <TimelineCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              view={timelineView}
              onViewChange={setTimelineView}
              assignments={task.dateAssignments || []}
              subtasks={task.subtasks}
              onDateClick={handleDateClick}
            />

            {/* Filters and Search */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Subtasks ({filteredSubtasks.length})
                  </h2>
                  <p className="text-sm text-gray-600">
                    {filteredSubtasks.length} subtasks grouped by {Object.keys(scenarioGroups).length} scenarios
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search scenarios, categories, or JIRA numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="1">High (1)</option>
                  <option value="2">Medium (2)</option>
                  <option value="3">Low (3)</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {[...new Set(task.subtasks.map(s => s.category))].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={assignmentFilter}
                  onChange={(e) => setAssignmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Assignment</option>
                  <option value="assigned">Assigned</option>
                  <option value="not_assigned">Not Assigned</option>
                  <option value="past_due">Past Due</option>
                </select>
                <select
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Completion</option>
                  <option value="completed">Completed</option>
                  <option value="not_completed">Not Completed</option>
                </select>
              </div>

              {/* Scenario Groups */}
              <div className="space-y-4">
                {Object.entries(scenarioGroups).map(([scenario, subtasks]) => (
                  <ScenarioGroupRow
                    key={scenario}
                    scenario={scenario}
                    subtasks={subtasks}
                    isExpanded={expandedRows.has(scenario)}
                    onToggle={() => handleRowToggle(scenario)}
                    onEditSubtask={canEdit ? undefined : undefined} // TODO: Implement edit functionality
                    onSelectSubtask={setSelectedSubtask}
                  />
                ))}

                {Object.keys(scenarioGroups).length === 0 && (
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
            <p className="text-gray-400 mb-4">The task you're looking for doesn't exist or you don't have permission to view it.</p>
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

      {/* Day Missions Modal */}
      {showDayMissions && (
        <DayMissionsModal
          selectedDate={selectedDate}
          assignments={task?.dateAssignments || []}
          allSubtasks={task?.subtasks || []}
          isOpen={showDayMissions}
          onClose={() => setShowDayMissions(false)}
          canManage={canManage}
          onAssignTasks={handleAssignTasks}
          onRemoveAssignment={handleRemoveAssignment}
        />
      )}

      {/* Enhanced Subtask Detail Modal */}
      {selectedSubtask && (
        <SubtaskDetailModal
          subtask={selectedSubtask}
          isOpen={!!selectedSubtask}
          onClose={() => setSelectedSubtask(null)}
          onEdit={canEdit ? undefined : undefined} // TODO: Implement edit functionality
          canEdit={canEdit}
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