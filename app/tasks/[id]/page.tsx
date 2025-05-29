'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { TTTask, TTSubtask, DateAssignment } from '@/lib/types';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { TTTaskAIInsights } from '@/components/TTTaskAIInsights';
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
  Target,
  MessageCircle,
  Send
} from 'lucide-react';

// Day Missions Modal Component with Duration Support
interface DayMissionsModalProps {
  selectedDate: Date;
  assignments: DateAssignment[];
  allSubtasks: TTSubtask[];
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  task?: TTTask; // Add task for legacy assignment handling
  token?: string; // Add token for API calls
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
  onRemoveLegacyAssignment?: (subtaskId: string) => void;
  onRefreshTask?: () => Promise<void>; // Add refresh function
}

function DayMissionsModal({ 
  selectedDate, 
  assignments, 
  allSubtasks, 
  isOpen, 
  onClose, 
  canManage,
  task,
  token,
  onAssignTasks,
  onRemoveAssignment,
  onRemoveLegacyAssignment,
  onRefreshTask
}: DayMissionsModalProps) {
  const [selectedSubtasks, setSelectedSubtasks] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAlreadyAssigned, setShowAlreadyAssigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [isApplyingAiSuggestion, setIsApplyingAiSuggestion] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  
  // New duration assignment states
  const [assignmentType, setAssignmentType] = useState<'single_day' | 'date_range' | 'duration_days'>('single_day');
  const [startDate, setStartDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(1);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  
  const dateString = selectedDate.toISOString().split('T')[0];
  
  // New due time selection
  const [selectedDueTime, setSelectedDueTime] = useState<string>('17:00');
  
  // Helper functions - moved to top to avoid hoisting issues
  const getDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    
    return dates;
  };

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

  const getAssignmentDates = (assignment: DateAssignment): string[] => {
    console.log('[getAssignmentDates] Processing assignment:', {
      id: assignment.id,
      assignmentType: assignment.assignmentType,
      date: assignment.date,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      durationDays: assignment.durationDays,
      fullAssignment: assignment
    });
    
    switch (assignment.assignmentType) {
      case 'single_day':
        const singleDayResult = assignment.date ? [assignment.date] : [];
        console.log('[getAssignmentDates] Single day result:', singleDayResult);
        return singleDayResult;
      case 'date_range':
        if (assignment.startDate && assignment.endDate) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          const endDate = new Date(assignment.endDate);
          
          for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
            dates.push(current.toISOString().split('T')[0]);
          }
          console.log('[getAssignmentDates] Date range result:', dates);
          return dates;
        }
        console.log('[getAssignmentDates] Date range - missing start/end dates');
        return [];
      case 'duration_days':
        if (assignment.startDate && assignment.durationDays) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          
          for (let i = 0; i < assignment.durationDays; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            dates.push(current.toISOString().split('T')[0]);
          }
          console.log('[getAssignmentDates] Duration days result:', dates);
          return dates;
        }
        console.log('[getAssignmentDates] Duration days - missing start date or duration');
        return [];
      default:
        console.log('[getAssignmentDates] Unknown assignment type:', assignment.assignmentType);
        return [];
    }
  };
  
  // Debug logging to understand the assignment data
  console.log('[DayMissionsModal] Debug Info:');
  console.log('[DayMissionsModal] Selected date:', dateString);
  console.log('[DayMissionsModal] Assignments array:', assignments);
  console.log('[DayMissionsModal] Assignments length:', assignments?.length || 0);
  
  // Deep logging of assignments
  assignments?.forEach((assignment, index) => {
    console.log(`[DayMissionsModal] Assignment ${index}:`, {
      id: assignment.id,
      assignmentType: assignment.assignmentType,
      date: assignment.date,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      durationDays: assignment.durationDays,
      subtaskIds: assignment.subtaskIds,
      isActive: assignment.isActive,
      fullObject: assignment
    });
  });
  
  // Handle both new dateAssignments and legacy individual subtask assignments
  const getAssignmentsForDate = (): TTSubtask[] => {
    const assignedSubtasks: TTSubtask[] = [];
    
    console.log('[getAssignmentsForDate] Processing date:', dateString);
    console.log('[getAssignmentsForDate] Total assignments available:', assignments?.length || 0);
    console.log('[getAssignmentsForDate] Total subtasks available:', allSubtasks?.length || 0);
    
    // First, check new dateAssignments system
    if (assignments && assignments.length > 0) {
      const relevantAssignments = assignments.filter(assignment => {
        const assignmentDates = getAssignmentDates(assignment);
        const includes = assignmentDates.includes(dateString);
        console.log('[getAssignmentsForDate] Assignment:', assignment.id, 'dates:', assignmentDates, 'includes date:', includes);
        return includes;
      });
      
      console.log('[getAssignmentsForDate] Relevant assignments:', relevantAssignments.length);
      
      const assignedSubtaskIds = relevantAssignments.flatMap(a => a.subtaskIds);
      console.log('[getAssignmentsForDate] Assigned subtask IDs from new system:', assignedSubtaskIds);
      
      assignedSubtasks.push(...allSubtasks.filter(s => assignedSubtaskIds.includes(s.id)));
    }
    
    // Fallback: check legacy individual subtask assignments
    const legacyAssignedSubtasks = allSubtasks.filter(subtask => 
      subtask.assignedDate === dateString && 
      subtask.isAssigned &&
      !assignedSubtasks.some(s => s.id === subtask.id) // Avoid duplicates
    );
    
    console.log('[getAssignmentsForDate] Legacy assigned subtasks:', legacyAssignedSubtasks.length);
    legacyAssignedSubtasks.forEach((subtask, index) => {
      console.log(`[getAssignmentsForDate] Legacy subtask ${index}:`, {
        id: subtask.id,
        scenario: subtask.scenario,
        assignedDate: subtask.assignedDate,
        isAssigned: subtask.isAssigned,
        assignmentId: subtask.assignmentId,
        status: subtask.status,
        isExecuted: subtask.isExecuted
      });
    });
    
    assignedSubtasks.push(...legacyAssignedSubtasks);
    
    console.log('[getAssignmentsForDate] Total assigned subtasks for date:', assignedSubtasks.length);
    
    return assignedSubtasks;
  };
  
  // Get assignments that cover the selected date
  const relevantAssignments = assignments?.filter(assignment => {
    const assignmentDates = getAssignmentDates(assignment);
    const isRelevant = assignmentDates.includes(dateString);
    return isRelevant;
  }) || [];
  
  const assignedSubtaskIds = relevantAssignments.flatMap(a => a.subtaskIds);
  const assignedSubtasks = getAssignmentsForDate(); // Use the new function that handles both systems
  
  console.log('[DayMissionsModal] Assigned subtask IDs:', assignedSubtaskIds);
  console.log('[DayMissionsModal] Assigned subtasks:', assignedSubtasks);
  
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
    if (selectedSubtasks.length === 0) {
      alert('Please select at least one subtask to assign.');
      return;
    }

    if (onAssignTasks) {
      const assignmentData = {
        assignmentType: assignmentType as 'single_day' | 'date_range' | 'duration_days',
        date: assignmentType === 'single_day' ? dateString : undefined,
        startDate: assignmentType === 'date_range' ? startDate : undefined,
        endDate: assignmentType === 'date_range' ? endDate : undefined,
        durationDays: assignmentType === 'duration_days' ? durationDays : undefined,
        subtaskIds: selectedSubtasks,
        notes: assignmentNotes,
        title: assignmentTitle || `${selectedSubtasks.length} Task Assignment`,
        overrideConflicts: false
      };

      onAssignTasks(assignmentData);
      
      // Show success and close modals
      setApplySuccessMessage(`Assigned ${selectedSubtasks.length} tasks successfully!`);
      setShowAssignModal(false);
      setSelectedSubtasks([]);
      setAssignmentNotes('');
      setAssignmentTitle('');
      
      // Auto-hide success message
      setTimeout(() => {
        setApplySuccessMessage(null);
      }, 3000);
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

  const handleRemoveLegacyAssignment = async (subtaskId: string) => {
    if (!task || !canManage) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${task.id}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedDate: undefined,
          isAssigned: false,
          assignmentId: undefined,
          assignmentType: undefined,
          assignedStartDate: undefined,
          assignedEndDate: undefined,
          executionStatus: 'not_assigned'
        }),
      });

      if (response.ok) {
        await onRefreshTask?.(); // Refresh task data
      } else {
        console.error('Failed to remove legacy assignment');
        alert('Failed to remove legacy assignment');
      }
    } catch (error) {
      console.error('Error removing legacy assignment:', error);
      alert('Failed to remove legacy assignment');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI suggestions when modal opens
  useEffect(() => {
    if (isOpen && allSubtasks && allSubtasks.length > 0) {
      try {
        generateAISuggestions();
      } catch (error) {
        console.error('Error generating AI suggestions:', error);
        setAiSuggestions([]);
      }
    } else {
      setAiSuggestions([]);
    }
  }, [isOpen, selectedDate, allSubtasks]);

  const generateAISuggestions = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const unassignedSubtasks = allSubtasks.filter(st => !st.isAssigned && !st.isExecuted);
    
    // Initialize suggestions array
    const suggestions: any[] = [];
    
    if (unassignedSubtasks.length === 0) {
      setAiSuggestions([]);
      return;
    }

    // Check if this is an empty day
    const existingAssignments = getAssignmentsForDate();
    const isEmptyDay = existingAssignments.length === 0;

    if (isEmptyDay) {
      // Lighting-based suggestions
      const lightingGroups = unassignedSubtasks.reduce((acc, st) => {
        const lighting = st.lighting || 'Day';
        if (!acc[lighting]) acc[lighting] = [];
        acc[lighting].push(st);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(lightingGroups).forEach(([lighting, subtasks]) => {
        if (subtasks.length >= 3) {
          suggestions.push({
            id: `lighting-${lighting}`,
            type: 'lighting_grouping',
            title: `${lighting} Scenarios Batch`,
            description: `Group ${subtasks.length} ${lighting.toLowerCase()} scenarios for efficient execution`,
            icon: lighting === 'Night' ? '🌙' : '☀️',
            priority: lighting === 'Night' ? 'high' : 'medium',
            subtasks: subtasks.slice(0, 8), // Limit to 8 for practical assignment
            reason: `Minimize lighting setup changes for ${lighting.toLowerCase()} testing`,
            estimatedTime: `${(subtasks.length * 0.4).toFixed(1)}h`,
            benefits: ['Reduced setup time', 'Consistent conditions', 'Higher efficiency']
          });
        }
      });

      // Scenario-based suggestions
      const scenarioGroups = unassignedSubtasks.reduce((acc, st) => {
        const scenario = st.scenario || 'Unknown';
        if (!acc[scenario]) acc[scenario] = [];
        acc[scenario].push(st);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(scenarioGroups).forEach(([scenario, subtasks]) => {
        if (subtasks.length >= 4) {
          suggestions.push({
            id: `scenario-${scenario}`,
            type: 'scenario_clustering',
            title: `${scenario} Focus Session`,
            description: `Dedicated session for ${subtasks.length} ${scenario} variations`,
            icon: '🎯',
            priority: scenario.includes('CBFA') ? 'high' : 'medium',
            subtasks: subtasks.slice(0, 6),
            reason: `Deep focus on ${scenario} with consistent setup`,
            estimatedTime: `${(subtasks.length * 0.35).toFixed(1)}h`,
            benefits: ['Scenario expertise', 'Consistent setup', 'Parameter optimization']
          });
        }
      });

      // Quick batch suggestion for any day
      if (unassignedSubtasks.length >= 5) {
        suggestions.push({
          id: 'quick-batch',
          type: 'quick_assignment',
          title: 'Quick Batch Assignment',
          description: `Assign next ${Math.min(8, unassignedSubtasks.length)} high-priority subtasks`,
          icon: '⚡',
          priority: 'medium',
          subtasks: unassignedSubtasks
            .sort((a, b) => {
              const priorityOrder = { '1': 3, 'high': 3, '2': 2, 'medium': 2, '3': 1, 'low': 1 };
              return (priorityOrder[b.priority as keyof typeof priorityOrder] || 1) - 
                     (priorityOrder[a.priority as keyof typeof priorityOrder] || 1);
            })
            .slice(0, 8),
          reason: 'Maintain momentum with immediate task scheduling',
          estimatedTime: `${(Math.min(8, unassignedSubtasks.length) * 0.5).toFixed(1)}h`,
          benefits: ['Quick progress', 'No delays', 'Efficient planning']
        });
      }
    } else {
      // Day has existing assignments - suggest complementary tasks
      const assignedLighting = existingAssignments.map(st => st.lighting);
      const hasNight = assignedLighting.includes('Night');
      const hasDay = assignedLighting.includes('Day');

      if (!hasNight && unassignedSubtasks.some(st => st.lighting === 'Night')) {
        const nightTasks = unassignedSubtasks.filter(st => st.lighting === 'Night').slice(0, 4);
        suggestions.push({
          id: 'complement-night',
          type: 'complement',
          title: 'Add Night Scenarios',
          description: `Add ${nightTasks.length} night scenarios to complement day testing`,
          icon: '🌙',
          priority: 'medium',
          subtasks: nightTasks,
          reason: 'Complete lighting coverage for comprehensive testing',
          estimatedTime: `${(nightTasks.length * 0.4).toFixed(1)}h`,
          benefits: ['Complete coverage', 'Efficient batching', 'Full day utilization']
        });
      }

      if (!hasDay && unassignedSubtasks.some(st => st.lighting === 'Day')) {
        const dayTasks = unassignedSubtasks.filter(st => st.lighting === 'Day').slice(0, 4);
        suggestions.push({
          id: 'complement-day',
          type: 'complement',
          title: 'Add Day Scenarios',
          description: `Add ${dayTasks.length} day scenarios to complement night testing`,
          icon: '☀️',
          priority: 'medium',
          subtasks: dayTasks,
          reason: 'Complete lighting coverage for comprehensive testing',
          estimatedTime: `${(dayTasks.length * 0.4).toFixed(1)}h`,
          benefits: ['Complete coverage', 'Efficient batching', 'Full day utilization']
        });
      }
    }

    setAiSuggestions(suggestions.slice(0, 3) || []); // Show top 3 suggestions
  };

  const handleApplyAiSuggestion = async (suggestion: any) => {
    if (!suggestion || !suggestion.subtasks) {
      console.error('Invalid suggestion data:', suggestion);
      return;
    }

    setIsApplyingAiSuggestion(true);
    try {
      // Apply the AI suggestion by auto-assigning the subtasks
      const subtaskIds = suggestion.subtasks.map((st: any) => st.id);
      const assignmentData = {
        assignmentType: 'single_day' as const,
        date: selectedDate.toISOString().split('T')[0],
        subtaskIds,
        title: suggestion.title,
        notes: `AI Applied: ${suggestion.reason}`,
        overrideConflicts: false
      };
      
      if (onAssignTasks) {
        onAssignTasks(assignmentData);
      }
      
      // Show success message
      setApplySuccessMessage(`Applied: ${suggestion.title}`);
      setShowAiSuggestions(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setApplySuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
    } finally {
      setIsApplyingAiSuggestion(false);
    }
  };

  const refreshTaskData = async () => {
    // Implement refreshTaskData logic
  };

  const sendChatMessage = async () => {
    // These functions are duplicated and should be removed
    // if (!currentMessage.trim() || isChatLoading) return;
    return;
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
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
              <>
                <Button 
                  onClick={() => setShowAssignModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Tasks
                </Button>
                
                {/* Bulk remove button */}
                {assignedSubtasks.length > 0 && (
                  <Button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove all ${assignedSubtasks.length} task assignments for ${formatDate(selectedDate)}?`)) {
                        // Remove all assignments for this day with improved logic
                        assignedSubtasks.forEach(subtask => {
                          console.log('[DayMissionsModal] Bulk removing subtask:', subtask.id);
                          console.log('[DayMissionsModal] Bulk subtask details:', {
                            id: subtask.id,
                            assignedDate: subtask.assignedDate,
                            isAssigned: subtask.isAssigned,
                            assignmentId: subtask.assignmentId,
                            scenario: subtask.scenario
                          });
                          
                          const assignment = assignments?.find(a => a.subtaskIds.includes(subtask.id) && a.id);
                          if (assignment && assignment.id) {
                            console.log('[DayMissionsModal] Bulk removing via new system:', { assignmentId: assignment.id, subtaskId: subtask.id });
                            onRemoveAssignment?.(assignment.id, subtask.id);
                          } else if (subtask.assignedDate && subtask.isAssigned) {
                            console.log('[DayMissionsModal] Bulk removing via legacy system:', subtask.id);
                            onRemoveLegacyAssignment?.(subtask.id);
                          } else {
                            console.warn('[DayMissionsModal] No valid assignment found for bulk removal:', subtask.id);
                            console.warn('[DayMissionsModal] Attempting legacy bulk removal anyway...');
                            onRemoveLegacyAssignment?.(subtask.id);
                          }
                        });
                      }
                    }}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove All
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Success Message */}
          {applySuccessMessage && (
            <div className="mx-4 mt-3 mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              ✅ {applySuccessMessage}
            </div>
          )}

          {/* AI Smart Suggestions */}
          {aiSuggestions && aiSuggestions.length > 0 && showAiSuggestions && (
            <div className="mx-4 mb-3 p-2 bg-purple-50 rounded border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                  <h3 className="text-xs font-medium text-purple-900">AI Suggestions</h3>
                </div>
                <button
                  onClick={() => setShowAiSuggestions(false)}
                  className="text-purple-600 hover:text-purple-800 text-xs p-1"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-1">
                {aiSuggestions.slice(0, 1).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium text-gray-900 truncate">{suggestion.title}</div>
                      <div className="text-gray-500 truncate">
                        {suggestion.subtasks && suggestion.subtasks.length > 0 ? suggestion.subtasks.length : 0} tasks • {suggestion.estimatedTime || '0h'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyAiSuggestion(suggestion)}
                      disabled={isApplyingAiSuggestion}
                      className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isApplyingAiSuggestion ? '...' : 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main content area */}
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
                    <div key={subtask.id} className="bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 group relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
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
                        
                        {/* Remove Assignment Button - Always visible for managers */}
                        {canManage && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Find the assignment for this subtask with better logging
                              console.log('[DayMissionsModal] Looking for assignment for subtask:', subtask.id);
                              console.log('[DayMissionsModal] Subtask details:', {
                                id: subtask.id,
                                assignedDate: subtask.assignedDate,
                                isAssigned: subtask.isAssigned,
                                assignmentId: subtask.assignmentId,
                                scenario: subtask.scenario
                              });
                              console.log('[DayMissionsModal] Available assignments:', assignments?.map(a => ({
                                id: a.id,
                                subtaskIds: a.subtaskIds,
                                includesThisSubtask: a.subtaskIds.includes(subtask.id),
                                hasValidId: !!a.id
                              })));
                              
                              const assignment = assignments?.find(a => a.subtaskIds.includes(subtask.id) && a.id);
                              console.log('[DayMissionsModal] Found valid assignment:', assignment);
                              
                              if (assignment && assignment.id) {
                                // New assignment system - only if assignment has a valid ID
                                console.log('[DayMissionsModal] Removing via new system:', { assignmentId: assignment.id, subtaskId: subtask.id });
                                onRemoveAssignment?.(assignment.id, subtask.id);
                              } else if (subtask.assignedDate && subtask.isAssigned) {
                                // Legacy assignment system - clear the individual subtask assignment
                                console.log('[DayMissionsModal] Removing via legacy system:', subtask.id);
                                onRemoveLegacyAssignment?.(subtask.id);
                              } else {
                                console.warn('[DayMissionsModal] No valid assignment found for subtask:', subtask.id);
                                console.warn('[DayMissionsModal] Attempting legacy removal anyway...');
                                onRemoveLegacyAssignment?.(subtask.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 transition-all p-1 h-7 w-7 rounded-md flex items-center justify-center"
                            title="Remove assignment"
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
        </div>

        {/* Task Assignment Modal */}
        {showAssignModal && canManage && (
          <div 
            className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAssignModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg w-full max-w-4xl h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col">
              {/* Header - Fixed */}
              <div className="flex-shrink-0 p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Assign Tasks</h3>
                
                {/* Assignment Type Selection - Responsive */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Assignment Type</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('single_day')}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'single_day' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium text-sm">Single Day</span>
                      </div>
                      <p className="text-xs text-gray-600">Assign to one specific date</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAssignmentType('date_range')}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'date_range' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <CalendarRange className="h-4 w-4" />
                        <span className="font-medium text-sm">Date Range</span>
                      </div>
                      <p className="text-xs text-gray-600">Set start and end dates</p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAssignmentType('duration_days')}
                      className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        assignmentType === 'duration_days' 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <CalendarDays className="h-4 w-4" />
                        <span className="font-medium text-sm">Duration</span>
                      </div>
                      <p className="text-xs text-gray-600">Start date + number of days</p>
                    </button>
                  </div>
                </div>

                {/* Date Configuration - Responsive */}
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Date Configuration</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignmentType === 'single_day' && (
                      <div className="sm:col-span-2">
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
                  
                  {/* Assignment Preview - Compact */}
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Preview</div>
                    <div className="text-xs text-blue-700">
                      {getAssignmentPreviewDates().length > 0 ? (
                        <>
                          <div>Dates: {getAssignmentPreviewDates().slice(0, 3).join(', ')}{getAssignmentPreviewDates().length > 3 ? '...' : ''}</div>
                          <div className="mt-1">Duration: {getAssignmentPreviewDates().length} day{getAssignmentPreviewDates().length !== 1 ? 's' : ''}</div>
                        </>
                      ) : (
                        'Please configure the assignment dates above'
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Tab Navigation - Compact */}
                <div className="flex items-center space-x-3 text-sm">
                  <button
                    onClick={() => setShowAlreadyAssigned(false)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      !showAlreadyAssigned 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    Available ({availableSubtasks.length})
                  </button>
                  <button
                    onClick={() => setShowAlreadyAssigned(true)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      showAlreadyAssigned 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
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
                    <div className="space-y-4 mb-4">
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
                    <div className="space-y-4 mb-4">
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

// Calendar Week Row Component for Multi-day Assignment Bars
interface CalendarWeekRowProps {
  weekDays: Date[];
  assignments: DateAssignment[];
  subtasks: TTSubtask[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDateClick: (date: Date) => void;
  isCurrentMonth: (date: Date) => boolean;
  getDateAssignmentInfo: (date: Date) => any;
  getDateTooltip: (assignmentInfo: any, date: Date) => string;
  canManage?: boolean;
  onRemoveAssignment?: (assignmentId: string, subtaskId: string) => void;
  onRemoveLegacyAssignment?: (subtaskId: string) => void;
}

function CalendarWeekRow({ 
  weekDays, 
  assignments, 
  subtasks, 
  selectedDate, 
  onDateSelect, 
  onDateClick, 
  isCurrentMonth,
  getDateAssignmentInfo,
  getDateTooltip,
  canManage,
  onRemoveAssignment,
  onRemoveLegacyAssignment
}: CalendarWeekRowProps) {
  const today = new Date();
  
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // Helper function to get assignment color based on priority and type
  const getAssignmentColor = (assignment: DateAssignment, assignedSubtasks: TTSubtask[]) => {
    // Get the highest priority among assigned subtasks
    const priorities = assignedSubtasks.map(s => parseInt(s.priority) || 3);
    const highestPriority = Math.min(...priorities);
    
    // Determine completion status
    const completedCount = assignedSubtasks.filter(s => s.isExecuted || s.status === 'completed').length;
    const isCompleted = completedCount === assignedSubtasks.length;
    const isPartial = completedCount > 0;
    
    if (isCompleted) {
      return 'bg-emerald-200 text-emerald-800 border-emerald-300';
    } else if (isPartial) {
      return 'bg-sky-200 text-sky-800 border-sky-300';
    } else {
      switch (highestPriority) {
        case 1: return 'bg-rose-200 text-rose-800 border-rose-300'; // High priority
        case 2: return 'bg-amber-200 text-amber-800 border-amber-300'; // Medium priority
        case 3: return 'bg-teal-200 text-teal-800 border-teal-300'; // Low priority
        default: return 'bg-slate-200 text-slate-800 border-slate-300';
      }
    }
  };

  // Helper function for assignment dates
  const getAssignmentDates = (assignment: DateAssignment): string[] => {
    console.log('[getAssignmentDates] Processing assignment:', {
      id: assignment.id,
      assignmentType: assignment.assignmentType,
      date: assignment.date,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      durationDays: assignment.durationDays,
      fullAssignment: assignment
    });
    
    switch (assignment.assignmentType) {
      case 'single_day':
        const singleDayResult = assignment.date ? [assignment.date] : [];
        console.log('[getAssignmentDates] Single day result:', singleDayResult);
        return singleDayResult;
      case 'date_range':
        if (assignment.startDate && assignment.endDate) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          const endDate = new Date(assignment.endDate);
          
          for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
            dates.push(current.toISOString().split('T')[0]);
          }
          console.log('[getAssignmentDates] Date range result:', dates);
          return dates;
        }
        console.log('[getAssignmentDates] Date range - missing start/end dates');
        return [];
      case 'duration_days':
        if (assignment.startDate && assignment.durationDays) {
          const dates: string[] = [];
          const startDate = new Date(assignment.startDate);
          
          for (let i = 0; i < assignment.durationDays; i++) {
            const current = new Date(startDate);
            current.setDate(startDate.getDate() + i);
            dates.push(current.toISOString().split('T')[0]);
          }
          console.log('[getAssignmentDates] Duration days result:', dates);
          return dates;
        }
        console.log('[getAssignmentDates] Duration days - missing start date or duration');
        return [];
      default:
        console.log('[getAssignmentDates] Unknown assignment type:', assignment.assignmentType);
        return [];
    }
  };

  // Calculate assignment bars for this week
  const calculateAssignmentBars = () => {
    const weekDateStrings = weekDays.map(d => d.toISOString().split('T')[0]);
    const bars: Array<{
      assignment: DateAssignment;
      startCol: number;
      endCol: number;
      subtasks: TTSubtask[];
      level: number;
    }> = [];

    // Process each assignment
    assignments.forEach(assignment => {
      const assignmentDates = getAssignmentDates(assignment);
      const weekAssignmentDates = assignmentDates.filter(date => weekDateStrings.includes(date));
      
      if (weekAssignmentDates.length > 0) {
        const startCol = weekDateStrings.indexOf(weekAssignmentDates[0]);
        const endCol = weekDateStrings.indexOf(weekAssignmentDates[weekAssignmentDates.length - 1]);
        
        if (startCol !== -1 && endCol !== -1) {
          const assignedSubtasks = subtasks.filter(s => assignment.subtaskIds.includes(s.id));
          
          bars.push({
            assignment,
            startCol,
            endCol,
            subtasks: assignedSubtasks,
            level: 0 // Will be calculated below
          });
        }
      }
    });

    // Also handle legacy assignments
    const legacyBars = new Map<string, {
      date: string;
      subtasks: TTSubtask[];
      level: number;
    }>();

    const newSystemSubtaskIds = new Set(
      bars.flatMap(bar => bar.subtasks.map(s => s.id))
    );

    subtasks.forEach(subtask => {
      if (
        subtask.assignedDate && 
        subtask.isAssigned && 
        weekDateStrings.includes(subtask.assignedDate) &&
        !newSystemSubtaskIds.has(subtask.id) // Check if not already processed
      ) {
        const dateKey = subtask.assignedDate;
        if (!legacyBars.has(dateKey)) {
          legacyBars.set(dateKey, {
            date: dateKey,
            subtasks: [],
            level: 0
          });
        }
        legacyBars.get(dateKey)!.subtasks.push(subtask);
      }
    });

    // Convert legacy bars to assignment bar format
    legacyBars.forEach((legacyBar) => {
      const colIndex = weekDateStrings.indexOf(legacyBar.date);
      if (colIndex !== -1) {
        bars.push({
          assignment: {
            id: `legacy-${legacyBar.date}`,
            assignmentType: 'single_day',
            date: legacyBar.date,
            subtaskIds: legacyBar.subtasks.map(s => s.id),
            assignedBy: 'system',
            assignedAt: new Date().toISOString(),
            isActive: true
          },
          startCol: colIndex,
          endCol: colIndex,
          subtasks: legacyBar.subtasks,
          level: 0
        });
      }
    });

    // Calculate levels (stacking) to avoid overlaps
    bars.forEach((bar, index) => {
      let level = 0;
      const previousBars = bars.slice(0, index);
      
      while (true) {
        const conflicts = previousBars.filter(prevBar => 
          prevBar.level === level &&
          !(bar.endCol < prevBar.startCol || bar.startCol > prevBar.endCol)
        );
        
        if (conflicts.length === 0) {
          bar.level = level;
          break;
        }
        level++;
      }
    });

    return bars;
  };

  const assignmentBars = calculateAssignmentBars();
  const maxLevel = Math.max(0, ...assignmentBars.map(bar => bar.level));
  const mobileHeight = 100 + (maxLevel * 20); // Smaller spacing for mobile
  const desktopHeight = 140 + (maxLevel * 28); // Larger spacing for desktop

  return (
    <div 
      className="relative border-b border-gray-100 last:border-b-0" 
      style={{ 
        minHeight: `${mobileHeight}px`,
        // Use CSS custom properties for responsive height
      }}
    >
      {/* Day cells */}
      <div className="grid grid-cols-7 h-full">
        {weekDays.map((date, dayIndex) => {
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const assignmentInfo = getDateAssignmentInfo(date);
          
          // Fixed sizing approach with modern styling - responsive
          let dayClass = 'h-full min-h-[120px] sm:min-h-[140px] relative cursor-pointer transition-all duration-200 border-r border-gray-100 last:border-r-0 hover:bg-gray-25 flex flex-col p-1 sm:p-2';
          let textClass = 'text-sm font-medium text-gray-700';
          let dateNumClass = 'text-base sm:text-lg font-semibold mb-1 sm:mb-2';
          
          // Today styling
          if (isTodayDate) {
            dayClass = dayClass.replace('hover:bg-gray-25', 'hover:bg-blue-50');
            dayClass += ' bg-blue-50 border-r-blue-100';
            textClass = 'text-blue-700 font-medium';
            dateNumClass = 'text-blue-800 font-bold text-base sm:text-lg mb-1 sm:mb-2';
          }
          // Selected styling
          else if (isSelectedDate) {
            dayClass = dayClass.replace('hover:bg-gray-25', 'hover:bg-indigo-50');
            dayClass += ' bg-indigo-50 border-r-indigo-100';
            textClass = 'text-indigo-700 font-medium';
            dateNumClass = 'text-indigo-800 font-semibold text-base sm:text-lg mb-1 sm:mb-2';
          }
          // Other month dates - muted
          else if (!isCurrentMonthDate) {
            textClass = 'text-gray-400';
            dateNumClass = 'text-gray-400 text-base sm:text-lg mb-1 sm:mb-2';
            dayClass = dayClass.replace('hover:bg-gray-25', 'hover:bg-gray-25');
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
              <div className={dateNumClass}>
                {date.getDate()}
              </div>
              
              {/* Today indicator */}
              {isTodayDate && (
                <div className="absolute inset-0 bg-blue-100 rounded-xl opacity-50 pointer-events-none"></div>
              )}
              
              {/* Task count indicator for mobile - always visible */}
              {assignmentInfo.hasAssignments && (
                <div className="mt-auto flex items-center justify-end">
                  <div className={`w-2 h-2 rounded-full ${
                    assignmentInfo.dayStatus === 'completed' ? 'bg-emerald-400' :
                    assignmentInfo.dayStatus === 'partial' ? 'bg-sky-400' :
                    assignmentInfo.dayStatus === 'pending_future' ? 'bg-amber-300' :
                    assignmentInfo.dayStatus === 'pending_past' ? 'bg-rose-400' : 'bg-gray-300'
                  }`}></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Assignment bars overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {assignmentBars.map((bar, index) => {
          const colorClass = getAssignmentColor(bar.assignment, bar.subtasks);
          const width = ((bar.endCol - bar.startCol + 1) / 7) * 100;
          const left = (bar.startCol / 7) * 100;
          const top = 45 + (bar.level * 24); // Mobile: smaller spacing, Desktop: larger
          const height = 20; // Mobile: smaller height, Desktop: larger
          
          return (
            <div
              key={`${bar.assignment.id}-${index}`}
              className={`absolute rounded-lg border transition-all duration-200 hover:shadow-sm hover:z-10 group ${colorClass}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                top: `${top}px`,
                height: `${height}px`,
                zIndex: bar.level + 1
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Handle assignment bar click - could open assignment details
              }}
              title={`${bar.assignment.title || 'Assignment'} - ${bar.subtasks.length} tasks`}
            >
              <div className="flex items-center justify-between h-full px-1 sm:px-2 text-xs font-medium truncate">
                <span className="truncate text-xs sm:text-sm flex-1">
                  {bar.assignment.title || `${bar.subtasks[0]?.scenario || 'Tasks'}`}
                </span>
                
                {/* Assignment controls */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <span className="hidden sm:inline text-xs opacity-75">
                    {bar.subtasks.filter(s => s.isExecuted || s.status === 'completed').length}/{bar.subtasks.length}
                  </span>
                  
                  {/* Remove assignment button */}
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bar.assignment.id.startsWith('legacy-')) {
                          // Handle legacy assignment removal
                          bar.subtasks.forEach(subtask => {
                            onRemoveLegacyAssignment?.(subtask.id);
                          });
                        } else {
                          // Remove all subtasks from this assignment
                          bar.subtasks.forEach(subtask => {
                            onRemoveAssignment?.(bar.assignment.id, subtask.id);
                          });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black hover:bg-opacity-10 rounded text-white hover:text-red-200"
                      title="Remove assignment"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="absolute bottom-0 left-0 h-1 bg-black bg-opacity-10 rounded-b-lg">
                <div 
                  className="h-full bg-white bg-opacity-50 rounded-b-lg transition-all duration-300"
                  style={{ 
                    width: `${(bar.subtasks.filter(s => s.isExecuted || s.status === 'completed').length / bar.subtasks.length) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Mobile priority indicator */}
              <div className="absolute top-1 right-1 sm:hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  bar.subtasks.filter(s => s.isExecuted || s.status === 'completed').length === bar.subtasks.length ? 'bg-white bg-opacity-75' :
                  bar.subtasks.some(s => s.isExecuted || s.status === 'completed') ? 'bg-yellow-200' : 'bg-white bg-opacity-60'
                }`}></div>
              </div>
            </div>
          );
        })}
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
  canManage?: boolean;
  onRemoveAssignment?: (assignmentId: string, subtaskId: string) => void;
  onRemoveLegacyAssignment?: (subtaskId: string) => void;
}

function TimelineCalendar({ 
  selectedDate, 
  onDateSelect, 
  view, 
  onViewChange, 
  assignments,
  subtasks,
  onDateClick,
  canManage,
  onRemoveAssignment,
  onRemoveLegacyAssignment
}: TimelineCalendarProps) {
  const today = new Date();
  
  const getDateAssignmentInfo = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Find all assignments that cover this date (new system)
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

    // Get all subtasks assigned to this date (new system)
    const assignedSubtaskIds = relevantAssignments.flatMap(a => a.subtaskIds);
    let assignedSubtasks = subtasks.filter(s => assignedSubtaskIds.includes(s.id));
    
    // Also check for legacy individual subtask assignments
    const legacyAssignedSubtasks = subtasks.filter(subtask => 
      subtask.assignedDate === dateString && 
      subtask.isAssigned &&
      !assignedSubtasks.some(s => s.id === subtask.id) // Avoid duplicates
    );
    
    assignedSubtasks = [...assignedSubtasks, ...legacyAssignedSubtasks];
    
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
    let baseClass = 'relative transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 overflow-hidden';
    let dateClass = '';
    let textClass = '';
    let borderClass = '';
    let bgClass = '';
    
    // Today styling - minimal border approach
    if (isTodayDate) {
      borderClass = 'border-2 border-blue-300';
      bgClass = 'bg-blue-100';
      textClass = 'text-blue-800 font-semibold';
      dateClass = '';
    }
    // Selected styling - secondary prominence
    else if (isSelectedDate) {
      borderClass = 'border border-indigo-300';
      bgClass = 'bg-indigo-100';
      textClass = 'text-indigo-800 font-medium';
      dateClass = '';
    }
    // Assignment status styling
    else {
      switch (assignmentInfo.dayStatus) {
        case 'completed':
          bgClass = 'bg-emerald-100 border border-emerald-200';
          textClass = 'text-emerald-800';
          borderClass = 'hover:border-emerald-300';
          break;
        case 'partial':
          bgClass = 'bg-sky-100 border border-sky-200';
          textClass = 'text-sky-800';
          borderClass = 'hover:border-sky-300';
          break;
        case 'pending_future':
          bgClass = 'bg-amber-100 border border-amber-200';
          textClass = 'text-amber-800';
          borderClass = 'hover:border-amber-300';
          break;
        case 'pending_past':
          bgClass = 'bg-rose-100 border border-rose-200';
          textClass = 'text-rose-800';
          borderClass = 'hover:border-rose-300';
          break;
        default:
          bgClass = 'bg-white border border-gray-200';
          textClass = 'text-gray-700';
          borderClass = 'hover:border-gray-300';
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
          <div className={`${isTodayDate ? 'text-xl font-black relative z-10' : isSelectedDate ? 'text-lg font-bold' : 'text-lg font-semibold'} ${textClass}`}>
            {formatDate(date, 'dayNum')}
          </div>
          
          {/* Today indicator */}
          {isTodayDate && (
            <div className="text-xs font-medium text-blue-700 mt-1 px-2 py-0.5 bg-blue-200 rounded-lg">
              Today
            </div>
          )}
        </div>
        
        {/* Enhanced assignment indicators */}
        {assignmentInfo.hasAssignments && (
          <div className="absolute top-1 right-1">
            <div className="relative">
              {/* Status indicator */}
              <div className="w-3 h-3 rounded-full border border-white">
                {assignmentInfo.dayStatus === 'completed' && (
                  <div className="w-full h-full bg-emerald-400 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'partial' && (
                  <div className="w-full h-full bg-sky-400 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'pending_future' && (
                  <div className="w-full h-full bg-amber-300 rounded-full"></div>
                )}
                {assignmentInfo.dayStatus === 'pending_past' && (
                  <div className="w-full h-full bg-rose-400 rounded-full"></div>
                )}
              </div>
              
              {/* Task count badge */}
              <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-gray-700 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
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
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  )}
                  
                  {/* Progress bar */}
                  <div className="flex-1 h-1 mx-1 bg-blue-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 transition-all duration-300 rounded-full"
                      style={{ width: `${multiDay.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* End indicator */}
                  {multiDay.isEnd && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                {/* Day indicator */}
                <div className="text-xs text-blue-600 font-medium text-center">
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
    <Card className="border border-gray-200 bg-white rounded-xl">
      {/* View Switcher */}
      <div className="flex items-center justify-center mb-6 px-6 pt-6">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <Button
            variant={view === 'carousel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('carousel')}
            className={`h-8 px-4 rounded-lg transition-all ${
              view === 'carousel' 
                ? 'bg-white text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <CalendarRange className="h-3 w-3 mr-2" />
            Days
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            className={`h-8 px-4 rounded-lg transition-all ${
              view === 'week' 
                ? 'bg-white text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-600'
            }`}
          >
            <CalendarDays className="h-3 w-3 mr-2" />
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('month')}
            className={`h-8 px-4 rounded-lg transition-all ${
              view === 'month' 
                ? 'bg-white text-gray-900 hover:bg-gray-50' 
                : 'hover:bg-gray-200 text-gray-600'
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
              <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-sky-300 rounded-full"></div>
              <span>Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-300 rounded-full"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-rose-300 rounded-full"></div>
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Clean week grid */}
            <div className="space-y-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-gray-600 py-3 border-r border-gray-100 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Week view with assignment bars */}
              <CalendarWeekRow
                weekDays={generateWeekDays()}
                assignments={assignments}
                subtasks={subtasks}
                selectedDate={selectedDate}
                onDateSelect={onDateSelect}
                onDateClick={onDateClick}
                isCurrentMonth={() => true} // All days in week view are considered current
                getDateAssignmentInfo={getDateAssignmentInfo}
                getDateTooltip={getDateTooltip}
                canManage={canManage}
                onRemoveAssignment={onRemoveAssignment}
                onRemoveLegacyAssignment={onRemoveLegacyAssignment}
              />
            </div>
          </div>
        )}

        {view === 'month' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Clean month grid */}
            <div className="space-y-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-gray-50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-gray-600 py-3 border-r border-gray-100 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar weeks with assignment bars */}
              {Array.from({ length: 6 }).map((_, weekIndex) => {
                const weekDays = generateMonthDays().slice(weekIndex * 7, (weekIndex + 1) * 7);
                if (weekDays.length === 0) return null;
                
                return (
                  <CalendarWeekRow
                    key={weekIndex}
                    weekDays={weekDays}
                    assignments={assignments}
                    subtasks={subtasks}
                    selectedDate={selectedDate}
                    onDateSelect={onDateSelect}
                    onDateClick={onDateClick}
                    isCurrentMonth={isCurrentMonth}
                    getDateAssignmentInfo={getDateAssignmentInfo}
                    getDateTooltip={getDateTooltip}
                    canManage={canManage}
                    onRemoveAssignment={onRemoveAssignment}
                    onRemoveLegacyAssignment={onRemoveLegacyAssignment}
                  />
                );
              })}
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

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    id: string;
  }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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

  // Initialize chat with welcome message
  useEffect(() => {
    if (showChat && chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI assistant for the TT task "${task?.title || 'this task'}". I can help you with:\n\n• Task scheduling and planning\n• Subtask prioritization\n• Timeline optimization\n• Assignment strategies\n• Progress analysis\n\nWhat would you like to know?`,
        timestamp: new Date(),
        id: Date.now().toString()
      }]);
    }
  }, [showChat, task?.title]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading]);

  // Keyboard shortcuts for chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showChat) {
        // Escape to close chat
        if (e.key === 'Escape') {
          setShowChat(false);
        }
        // Ctrl+L to clear chat
        if (e.ctrlKey && e.key === 'l') {
          e.preventDefault();
          clearChat();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showChat]);

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
        // Handle conflicts - could show a conflict resolution dialog
        alert('There are conflicts with existing assignments. Please resolve them manually.');
      } else {
        alert('Failed to assign tasks: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error assigning tasks:', error);
      alert('Failed to assign tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, subtaskId: string) => {
    if (!task || !canManage) return;

    try {
      setIsLoading(true);
      
      // Enhanced debug logging
      console.log('[Frontend] Removing assignment:', { assignmentId, subtaskId });
      console.log('[Frontend] Available assignments:', task.dateAssignments?.map(a => ({
        id: a.id,
        subtaskIds: a.subtaskIds,
        type: a.assignmentType
      })) || []);
      
      // Validate inputs
      if (!assignmentId || !subtaskId) {
        console.error('[Frontend] Missing required data:', { assignmentId, subtaskId });
        alert('Error: Missing assignment or subtask ID');
        return;
      }
      
      const response = await fetch(`/api/tasks/tt/${taskId}/assignments`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignmentId: assignmentId,
          subtaskId: subtaskId,
        }),
      });

      const data = await response.json();
      
      console.log('[Frontend] Delete response:', { status: response.status, data });
      
      if (response.ok && data.success) {
        await fetchTask(); // Refresh task data
        console.log('[Frontend] Assignment removed successfully');
      } else {
        console.error('[Frontend] API Error:', data);
        alert('Failed to remove assignment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLegacyAssignment = async (subtaskId: string) => {
    if (!task || !canManage) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/tt/${task.id}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedDate: undefined,
          isAssigned: false,
          assignmentId: undefined,
          assignmentType: undefined,
          assignedStartDate: undefined,
          assignedEndDate: undefined,
          executionStatus: 'not_assigned'
        }),
      });

      if (response.ok) {
        await fetchTask(); // Refresh task data
      } else {
        console.error('Failed to remove legacy assignment');
        alert('Failed to remove legacy assignment');
      }
    } catch (error) {
      console.error('Error removing legacy assignment:', error);
      alert('Failed to remove legacy assignment');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTaskData = async () => {
    // Implement refreshTaskData logic
  };

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || isChatLoading) return;

    const userMessage = currentMessage.trim();
    const messageId = Date.now().toString();
    
    // Add user message
    const newUserMessage = {
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date(),
      id: messageId
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setCurrentMessage('');
    setIsChatLoading(true);
    setChatError(null);

    try {
      // Prepare context about the current task
      const taskContext = {
        title: task?.title,
        status: task?.status,
        totalSubtasks: task?.totalSubtasks,
        completedSubtasks: task?.subtasks.filter(s => s.isExecuted || s.status === 'completed').length,
        assignedSubtasks: task?.subtasks.filter(s => s.assignedDate).length,
        priorityDistribution: {
          high: task?.subtasks.filter(s => s.priority === '1').length,
          medium: task?.subtasks.filter(s => s.priority === '2').length,
          low: task?.subtasks.filter(s => s.priority === '3').length
        },
        scenarios: [...new Set(task?.subtasks.map(s => s.scenario))].slice(0, 10), // First 10 scenarios
        dateAssignments: task?.dateAssignments?.length || 0,
        location: task?.location,
        version: task?.version
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            type: 'tt_task',
            taskId: taskId,
            taskDetails: taskContext,
            currentDate: selectedDate.toISOString(),
            userRole: user?.role
          },
          conversationHistory: chatMessages.slice(-10) // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
       
      if (data.success && (data.response || data.data?.message)) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: data.response || data.data?.message || 'Sorry, I could not process your request.',
          timestamp: new Date(),
          id: (Date.now() + 1).toString()
        };

        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setChatError(errorMessage);
      
      // Add error message to chat
      const errorResponse = {
        role: 'assistant' as const,
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        id: (Date.now() + 2).toString()
      };
      
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatError(null);
  };

  const regenerateLastResponse = async () => {
    if (chatMessages.length < 2) return;
    
    const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last assistant message
    setChatMessages(prev => prev.filter(m => m.id !== chatMessages[chatMessages.length - 1].id));
    
    // Temporarily set the user message as current and resend
    setCurrentMessage(lastUserMessage.content);
    setTimeout(() => {
      sendChatMessage();
    }, 100);
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...chatMessages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setCurrentMessage(lastUserMessage.content);
      setChatError(null);
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/?section=TT')}
                      className="text-blue-600 hover:text-blue-700 h-8 px-2"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">{task.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{task.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-3 w-3 flex-shrink-0" />
                      <span>{task.totalSubtasks} subtasks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="hidden sm:inline">Updated: </span>
                      <span className="truncate">{formatDate(task.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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
                <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-700">{task.description}</p>
                </div>
              )}

              {/* Compact Progress Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Progress: </span>
                    <span className="font-semibold text-gray-900">
                      {task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length}/{task.totalSubtasks}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({Math.round((task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length / task.totalSubtasks) * 100)}%)
                    </span>
                  </div>
                </div>
                
                {/* Modern Minimal Progress Bar */}
                <div className="flex-1 sm:max-w-xs sm:ml-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${Math.round((task.subtasks.filter(s => s.isExecuted || s.status === 'completed').length / task.totalSubtasks) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Component */}
            <TTTaskAIInsights 
              task={task}
              assignments={task.dateAssignments || []}
              onSuggestAssignment={(suggestion) => {
                // Handle calendar suggestion - auto-fill assignment modal
                setSelectedDate(new Date(suggestion.date));
                setShowDayMissions(true);
                // Could also pre-select the suggested subtasks
              }}
            />

            {/* Enhanced Timeline */}
            <TimelineCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              view={timelineView}
              onViewChange={setTimelineView}
              assignments={task.dateAssignments || []}
              subtasks={task.subtasks}
              onDateClick={handleDateClick}
              canManage={canManage}
              onRemoveAssignment={handleRemoveAssignment}
              onRemoveLegacyAssignment={handleRemoveLegacyAssignment}
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
          task={task || undefined}
          token={token || undefined}
          onAssignTasks={handleAssignTasks}
          onRemoveAssignment={handleRemoveAssignment}
          onRemoveLegacyAssignment={handleRemoveLegacyAssignment}
          onRefreshTask={fetchTask}
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

      {/* Modern Minimal Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Main Chat Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              backgroundColor: showChat ? '#111111' : '#000000',
              transform: showChat ? 'scale(0.95) rotate(45deg)' : 'scale(1) rotate(0deg)',
            }}
            className={`
              relative h-14 w-14 rounded-full transition-all duration-300 ease-out
              hover:!bg-gray-800 hover:scale-105 active:scale-95
              shadow-2xl hover:shadow-3xl border border-gray-700/50
              flex items-center justify-center group-hover:border-gray-600/50
              !bg-black
            `}
          >
            {/* Button Content */}
            <div className="relative">
              {showChat ? (
                <X className="h-5 w-5 text-white transform -rotate-45 transition-transform duration-300" />
              ) : (
                <MessageCircle className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>

            {/* Status Indicator */}
            <div className={`
              absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white
              transition-all duration-300
              ${isChatLoading 
                ? 'bg-amber-400 animate-pulse' 
                : chatError 
                ? 'bg-red-500' 
                : 'bg-emerald-400'
              }
            `}>
              {!isChatLoading && !chatError && (
                <div className="h-full w-full rounded-full bg-emerald-400 animate-ping opacity-20" />
              )}
            </div>

            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-5 group-active:opacity-10 transition-opacity duration-200" />
          </button>

          {/* Modern Tooltip */}
          {!showChat && (
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-gray-700">
                AI Assistant
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}

          {/* Badge for unread messages (optional) */}
          {chatMessages.length > 1 && !showChat && (
            <div className="absolute -top-1 -left-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium border-2 border-white shadow-lg">
              {Math.min(chatMessages.filter(m => m.role === 'assistant').length, 9)}
            </div>
          )}
        </div>
      </div>

      {/* Modern Minimal Chat Modal */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* Sleek Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  isChatLoading ? 'bg-amber-400 animate-pulse' : 
                  chatError ? 'bg-red-400' : 'bg-emerald-400'
                }`} />
                {!isChatLoading && !chatError && (
                  <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-20" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">AI Assistant</h3>
                <p className="text-xs text-gray-500">
                  {isChatLoading ? 'Thinking...' : chatError ? 'Connection error' : 'Ready to help'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {chatMessages.length > 1 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  title="Clear chat"
                >
                  <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Minimal Error Banner */}
          {chatError && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                  <span className="text-red-700 text-xs">{chatError}</span>
                  <button
                    onClick={retryLastMessage}
                    className="text-red-600 hover:text-red-700 text-xs underline"
                  >
                    Retry
                  </button>
                </div>
                <button onClick={() => setChatError(null)} className="text-red-400 hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Clean Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%] group">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-black text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="text-xs text-gray-400">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {msg.role === 'assistant' && index === chatMessages.length - 1 && !isChatLoading && (
                      <button
                        onClick={regenerateLastResponse}
                        className="text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Regenerate response"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Smart Quick Actions */}
          {!isChatLoading && chatMessages.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {[
                  "📊 Progress analysis",
                  "📅 Schedule optimization", 
                  "⚡ Quick insights",
                  "🎯 Priorities"
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentMessage(suggestion.split(' ').slice(1).join(' '));
                      setTimeout(sendChatMessage, 100);
                    }}
                    className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sleek Input Area */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  value={currentMessage}
                  onChange={handleChatInputChange}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Ask about your tasks..."
                  className="min-h-[40px] max-h-[80px] text-sm resize-none pr-10 border-gray-200 rounded-xl bg-white focus:border-gray-300 focus:ring-0"
                  disabled={isChatLoading}
                  rows={1}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {currentMessage.length}
                </div>
              </div>
              <button
                onClick={sendChatMessage}
                disabled={!currentMessage.trim() || isChatLoading || currentMessage.length > 500}
                className="self-end h-10 w-10 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                {isChatLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
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