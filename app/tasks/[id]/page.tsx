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

// Day Missions Modal Component
interface DayMissionsModalProps {
  selectedDate: Date;
  assignments: DateAssignment[];
  allSubtasks: TTSubtask[];
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  onAssignTasks?: (date: string, subtaskIds: string[], notes?: string) => void;
  onRemoveAssignment?: (date: string, subtaskId: string) => void;
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAlreadyAssigned, setShowAlreadyAssigned] = useState(false);
  
  const dateString = selectedDate.toISOString().split('T')[0];
  const todayAssignments = assignments.filter(a => a.date === dateString);
  const assignedSubtaskIds = todayAssignments.flatMap(a => a.subtaskIds);
  const assignedSubtasks = allSubtasks.filter(s => assignedSubtaskIds.includes(s.id));
  
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
      onAssignTasks(dateString, selectedSubtasks, assignmentNotes);
      setSelectedSubtasks([]);
      setAssignmentNotes('');
      setShowAssignModal(false);
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
              <div className="space-y-3">
                {assignedSubtasks.map((subtask) => (
                  <div key={subtask.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(subtask.status)}
                          <span className="font-medium text-gray-900">
                            {subtask.jira_subtask_number || subtask.id}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {subtask.category}
                          </Badge>
                          <Badge variant="outline" className={getExecutionStatusColor(subtask)}>
                            {getExecutionStatusText(subtask)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{subtask.scenario}</span> • 
                          {subtask.lighting} • {subtask.target_speed} km/h → {subtask.ego_speed} km/h
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Runs: {subtask.executedRuns || 0}/{subtask.number_of_runs} • Priority: {subtask.priority}
                        </div>
                      </div>
                      {canManage && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onRemoveAssignment?.(dateString, subtask.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Assign Tasks to {formatDate(selectedDate)}</h3>
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
    const dayAssignments = assignments.filter(a => a.date === dateString);
    const assignedSubtaskIds = dayAssignments.flatMap(a => a.subtaskIds);
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
    
    return { 
      totalAssigned, 
      completed, 
      inProgress, 
      failed,
      dayStatus,
      hasAssignments: totalAssigned > 0 
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
    
    // Base styling
    let baseClass = 'relative transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1';
    let dateClass = '';
    let textClass = '';
    let borderClass = '';
    let bgClass = '';
    
    // Today styling - most prominent
    if (isTodayDate) {
      borderClass = 'ring-3 ring-orange-400 ring-offset-2';
      bgClass = 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-400';
      textClass = 'text-orange-900 font-bold';
      dateClass = 'shadow-lg';
    }
    // Selected styling - secondary prominence
    else if (isSelectedDate) {
      borderClass = 'ring-2 ring-blue-400 ring-offset-1';
      bgClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400';
      textClass = 'text-blue-900 font-semibold';
      dateClass = 'shadow-md';
    }
    // Assignment status styling
    else {
      switch (assignmentInfo.dayStatus) {
        case 'completed':
          bgClass = 'bg-gradient-to-br from-green-50 to-green-100 border border-green-200';
          textClass = 'text-green-900';
          borderClass = 'hover:ring-1 hover:ring-green-300';
          break;
        case 'partial':
          bgClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200';
          textClass = 'text-blue-900';
          borderClass = 'hover:ring-1 hover:ring-blue-300';
          break;
        case 'pending_future':
          bgClass = 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200';
          textClass = 'text-amber-900';
          borderClass = 'hover:ring-1 hover:ring-amber-300';
          break;
        case 'pending_past':
          bgClass = 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200';
          textClass = 'text-red-900';
          borderClass = 'hover:ring-1 hover:ring-red-300';
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
        <div className="text-center p-2">
          {/* Day label for carousel view */}
          {view === 'carousel' && (
            <div className={`text-xs font-medium mb-1 ${textClass.replace('font-bold', 'font-medium').replace('font-semibold', 'font-medium')}`}>
              {formatDate(date, 'day')}
            </div>
          )}
          
          {/* Date number - main focus */}
          <div className={`text-lg ${isTodayDate ? 'text-2xl font-black' : isSelectedDate ? 'text-xl font-bold' : 'font-semibold'} ${textClass}`}>
            {formatDate(date, 'dayNum')}
          </div>
          
          {/* Today indicator */}
          {isTodayDate && (
            <div className="text-xs font-bold text-orange-700 mt-1 animate-pulse">
              TODAY
            </div>
          )}
        </div>
        
        {/* Enhanced assignment indicators */}
        {assignmentInfo.hasAssignments && (
          <div className="absolute -bottom-1 -right-1">
            <div className="relative">
              {/* Status indicator */}
              <div className="w-4 h-4 rounded-full shadow-sm border-2 border-white">
                {assignmentInfo.dayStatus === 'completed' && (
                  <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
                {assignmentInfo.dayStatus === 'partial' && (
                  <div className="w-full h-full bg-blue-500 rounded-full relative overflow-hidden">
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 bg-green-400"></div>
                      <div className="w-1/2 bg-blue-400"></div>
                    </div>
                  </div>
                )}
                {assignmentInfo.dayStatus === 'pending_future' && (
                  <div className="w-full h-full bg-amber-400 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'pending_past' && (
                  <div className="w-full h-full bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Task count badge */}
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                {assignmentInfo.totalAssigned}
              </div>
            </div>
          </div>
        )}
      </button>
    );
  };

  // Helper function for date tooltips
  const getDateTooltip = (assignmentInfo: any, date: Date) => {
    const dateStr = date.toLocaleDateString();
    
    if (!assignmentInfo.hasAssignments) {
      return `${dateStr} - No tasks assigned`;
    }
    
    const { totalAssigned, completed, inProgress, failed, dayStatus } = assignmentInfo;
    
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
    
    return `${dateStr} - ${totalAssigned} tasks assigned\n${statusText}${failed > 0 ? `\n${failed} failed` : ''}`;
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
          <div className="flex space-x-2 overflow-x-auto pb-2 px-1">
            {generateCarouselDays().map((date, index) => {
              const baseClass = `flex-shrink-0 w-16 h-20 bg-white border border-gray-200 rounded-lg transition-all hover:border-gray-300 hover:shadow-sm flex items-center justify-center relative`;
              return renderDateButton(date, baseClass);
            })}
          </div>
        )}

        {view === 'week' && (
          <div className="bg-white">
            {/* Clean week grid */}
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-100 p-px rounded-lg mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="bg-white text-center text-xs font-medium text-gray-500 py-3 first:rounded-l-md last:rounded-r-md">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Week days */}
              <div className="grid grid-cols-7 gap-px bg-gray-100 p-px rounded-lg">
                {generateWeekDays().map((date, index) => {
                  const baseClass = `min-h-[80px] bg-white relative cursor-pointer transition-all duration-200 hover:bg-gray-50 flex items-center justify-center 
                    ${index === 0 ? 'rounded-l-lg' : ''} ${index === 6 ? 'rounded-r-lg' : ''}`;
                  return renderDateButton(date, baseClass);
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="bg-white">
            {/* Clean month grid */}
            <div className="space-y-1">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-100 p-px rounded-lg mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="bg-white text-center text-xs font-medium text-gray-500 py-3 first:rounded-l-md last:rounded-r-md">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-px bg-gray-100 p-px rounded-lg">
                {generateMonthDays().map((date, index) => {
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);
                  const isCurrentMonthDate = isCurrentMonth(date);
                  const assignmentInfo = getDateAssignmentInfo(date);
                  
                  // Minimal styling approach
                  let dayClass = 'bg-white min-h-[60px] relative group cursor-pointer transition-all duration-200 hover:bg-gray-50 flex flex-col';
                  let textClass = 'text-sm font-medium text-gray-700';
                  let dateNumClass = 'text-sm';
                  
                  // Rounded corners for first/last items
                  if (index < 7) { // First row
                    if (index === 0) dayClass += ' rounded-tl-md';
                    if (index === 6) dayClass += ' rounded-tr-md';
                  }
                  if (index >= 35) { // Last row
                    if (index === 35) dayClass += ' rounded-bl-md';
                    if (index === 41) dayClass += ' rounded-br-md';
                  }
                  
                  // Today styling - clean and prominent
                  if (isTodayDate) {
                    dayClass = dayClass.replace('bg-white', 'bg-blue-500 text-white');
                    textClass = 'text-white font-semibold';
                    dateNumClass = 'text-white font-bold';
                  }
                  // Selected styling - subtle
                  else if (isSelectedDate) {
                    dayClass = dayClass.replace('bg-white', 'bg-blue-50');
                    dayClass = dayClass.replace('hover:bg-gray-50', 'hover:bg-blue-100');
                    textClass = 'text-blue-700 font-medium';
                  }
                  // Other month dates - muted
                  else if (!isCurrentMonthDate) {
                    textClass = 'text-gray-400';
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
                      <div className="p-3 flex-1 flex flex-col">
                        {/* Date number */}
                        <div className={`${dateNumClass} mb-1`}>
                          {formatDate(date, 'dayNum')}
                        </div>
                        
                        {/* Today badge */}
                        {isTodayDate && (
                          <div className="text-xs font-medium opacity-90">
                            Today
                          </div>
                        )}
                        
                        {/* Assignment indicator - minimal dot */}
                        {assignmentInfo.hasAssignments && (
                          <div className="mt-auto flex items-center justify-between">
                            <div className={`w-2 h-2 rounded-full ${
                              assignmentInfo.dayStatus === 'completed' ? 'bg-green-400' :
                              assignmentInfo.dayStatus === 'partial' ? 'bg-blue-400' :
                              assignmentInfo.dayStatus === 'pending_future' ? 'bg-amber-400' :
                              assignmentInfo.dayStatus === 'pending_past' ? 'bg-red-400' : 'bg-gray-400'
                            } ${isTodayDate ? 'bg-white bg-opacity-80' : ''}`}></div>
                            <div className={`text-xs font-medium ${
                              isTodayDate ? 'text-white text-opacity-90' : 
                              isSelectedDate ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {assignmentInfo.totalAssigned}
                            </div>
                          </div>
                        )}
                      </div>
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

  const completedCount = subtasks.filter(s => s.status === 'completed' || s.isExecuted).length;
  const inProgressCount = subtasks.filter(s => s.status === 'in_progress').length;
  const pausedCount = subtasks.filter(s => s.status === 'paused').length;
  const pendingCount = subtasks.filter(s => s.status === 'pending').length;
  const assignedCount = subtasks.filter(s => s.assignedDate).length;

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
              <span className="font-mono text-xs text-blue-600 flex-shrink-0 font-bold">
                {subtask.jira_subtask_number || `#${subtask.id}`}
              </span>
              {subtask.assignedDate && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                  📅 {new Date(subtask.assignedDate).toLocaleDateString()}
                </span>
              )}
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

  const handleAssignTasks = async (date: string, subtaskIds: string[], notes?: string) => {
    if (!task || !canManage) return;

    // Check for assignment conflicts
    const conflicts = checkAssignmentConflicts(subtaskIds, date);
    
    if (conflicts.length > 0) {
      const confirmed = await showAssignmentConfirmation(conflicts, date);
      if (!confirmed) return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${taskId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          subtaskIds,
          notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchTask(); // Refresh task data
        } else {
          alert('Failed to assign tasks: ' + data.error);
        }
      } else {
        alert('Failed to assign tasks');
      }
    } catch (error) {
      console.error('Error assigning tasks:', error);
      alert('Failed to assign tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check assignment conflicts
  const checkAssignmentConflicts = (subtaskIds: string[], targetDate: string) => {
    if (!task) return [];
    
    const conflicts: { subtask: TTSubtask; reason: string; canOverride: boolean }[] = [];
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    subtaskIds.forEach(subtaskId => {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      if (!subtask) return;
      
      // Check if already completed
      if (subtask.isExecuted || subtask.status === 'completed') {
        conflicts.push({
          subtask,
          reason: 'Task already completed',
          canOverride: false
        });
        return;
      }
      
      // Check if already assigned to a different date
      if (subtask.assignedDate && subtask.assignedDate !== targetDate) {
        const assignedDateObj = new Date(subtask.assignedDate);
        const isPastAssignment = assignedDateObj < today;
        
        conflicts.push({
          subtask,
          reason: isPastAssignment 
            ? `Already assigned to ${subtask.assignedDate} (past date, not completed)`
            : `Already assigned to ${subtask.assignedDate}`,
          canOverride: !isPastAssignment // Can't override past assignments that aren't done
        });
      }
    });
    
    return conflicts;
  };

  // Helper function to show assignment confirmation dialog
  const showAssignmentConfirmation = (conflicts: { subtask: TTSubtask; reason: string; canOverride: boolean }[], targetDate: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const nonOverridable = conflicts.filter(c => !c.canOverride);
      const overridable = conflicts.filter(c => c.canOverride);
      
      if (nonOverridable.length > 0) {
        const message = `Cannot assign the following tasks:\n\n${nonOverridable.map(c => `• ${c.subtask.jira_subtask_number || c.subtask.id}: ${c.reason}`).join('\n')}`;
        alert(message);
        resolve(false);
        return;
      }
      
      if (overridable.length > 0) {
        const message = `The following tasks are already assigned:\n\n${overridable.map(c => `• ${c.subtask.jira_subtask_number || c.subtask.id}: ${c.reason}`).join('\n')}\n\nDo you want to reassign them to ${targetDate}?`;
        resolve(confirm(message));
        return;
      }
      
      resolve(true);
    });
  };

  const handleRemoveAssignment = async (date: string, subtaskId: string) => {
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
          date,
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
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        taskCounts={taskCounts}
      />

      <div className="container mx-auto px-4 py-6">
        {task ? (
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
                  <div className="text-2xl font-bold text-green-900">{task.completedSubtasks}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-700 mb-1">Progress</div>
                  <div className="text-2xl font-bold text-purple-900">{task.progress}%</div>
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