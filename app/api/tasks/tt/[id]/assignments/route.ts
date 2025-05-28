import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadTTTasks, saveTTTasks, generateId } from '@/lib/data-store';
import { DateAssignment, DateRangeUtils, AssignmentValidationResult, AssignmentConflict } from '@/lib/types';

// Helper function to validate assignment data
function validateAssignmentData(data: any): AssignmentValidationResult {
  const result: AssignmentValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    conflicts: []
  };

  // Validate assignment type
  if (!data.assignmentType || !['single_day', 'date_range', 'duration_days'].includes(data.assignmentType)) {
    result.errors.push('Invalid assignment type');
    result.isValid = false;
  }

  // Validate based on assignment type
  switch (data.assignmentType) {
    case 'single_day':
      if (!data.date) {
        result.errors.push('Date is required for single day assignment');
        result.isValid = false;
      }
      break;

    case 'date_range':
      if (!data.startDate || !data.endDate) {
        result.errors.push('Start date and end date are required for date range assignment');
        result.isValid = false;
      } else if (new Date(data.startDate) > new Date(data.endDate)) {
        result.errors.push('Start date cannot be after end date');
        result.isValid = false;
      }
      break;

    case 'duration_days':
      if (!data.startDate || !data.durationDays) {
        result.errors.push('Start date and duration are required for duration assignment');
        result.isValid = false;
      } else if (data.durationDays < 1 || data.durationDays > 365) {
        result.errors.push('Duration must be between 1 and 365 days');
        result.isValid = false;
      }
      break;
  }

  // Validate subtasks
  if (!Array.isArray(data.subtaskIds) || data.subtaskIds.length === 0) {
    result.errors.push('At least one subtask must be selected');
    result.isValid = false;
  }

  return result;
}

// POST - Assign tasks with duration support
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TT Assignment API] POST request received for duration assignment');
    
    const token = getTokenFromRequest(request);
    console.log('[TT Assignment API] Token extracted:', !!token);
    
    const payload = verifyToken(token || '');
    console.log('[TT Assignment API] Token verified:', !!payload, payload ? `User: ${payload.username}, Role: ${payload.role}` : 'Invalid token');
    
    if (!payload) {
      console.log('[TT Assignment API] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and data managers can assign tasks
    if (payload.role !== 'admin' && payload.role !== 'data_manager') {
      console.log('[TT Assignment API] Insufficient permissions');
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: taskId } = await params;
    console.log('[TT Assignment API] Task ID:', taskId);
    
    const requestBody = await request.json();
    console.log('[TT Assignment API] Request body:', requestBody);

    // Validate assignment data
    const validation = validateAssignmentData(requestBody);
    if (!validation.isValid) {
      console.log('[TT Assignment API] Validation failed:', validation.errors);
      return NextResponse.json(
        { success: false, error: validation.errors.join(', '), validation },
        { status: 400 }
      );
    }

    console.log('[TT Assignment API] Loading TT tasks...');
    const { tasks } = await loadTTTasks();
    console.log('[TT Assignment API] Loaded tasks:', tasks.length, 'tasks');
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    console.log('[TT Assignment API] Task found at index:', taskIndex);

    if (taskIndex === -1) {
      console.log('[TT Assignment API] Task not found. Available task IDs:', tasks.map(t => t.id));
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = tasks[taskIndex];
    console.log('[TT Assignment API] Working with task:', task.title, 'Subtasks:', task.subtasks.length);

    // Initialize dateAssignments if it doesn't exist
    if (!task.dateAssignments) {
      task.dateAssignments = [];
      console.log('[TT Assignment API] Initialized dateAssignments array');
    }

    // Create the new assignment
    const newAssignment: DateAssignment = {
      id: generateId(),
      assignmentType: requestBody.assignmentType,
      subtaskIds: requestBody.subtaskIds,
      assignedBy: payload.username,
      assignedAt: new Date().toISOString(),
      notes: requestBody.notes || '',
      title: requestBody.title || '',
      isActive: true,
      estimatedEffort: requestBody.estimatedEffort
    };

    // Set appropriate date fields based on assignment type
    switch (requestBody.assignmentType) {
      case 'single_day':
        newAssignment.date = requestBody.date;
        break;
      case 'date_range':
        newAssignment.startDate = requestBody.startDate;
        newAssignment.endDate = requestBody.endDate;
        break;
      case 'duration_days':
        newAssignment.startDate = requestBody.startDate;
        newAssignment.durationDays = requestBody.durationDays;
        // Calculate end date
        const endDate = new Date(requestBody.startDate);
        endDate.setDate(endDate.getDate() + requestBody.durationDays - 1);
        newAssignment.endDate = endDate.toISOString().split('T')[0];
        break;
    }

    // Get all dates covered by this assignment
    const assignmentDates = DateRangeUtils.getAssignmentDates(newAssignment);
    console.log('[TT Assignment API] Assignment covers dates:', assignmentDates);

    // Check for conflicts with existing assignments
    const conflicts: AssignmentConflict[] = [];
    for (const subtaskId of requestBody.subtaskIds) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      if (!subtask) {
        console.log('[TT Assignment API] Subtask not found:', subtaskId);
        continue;
      }

      // Check if already executed
      if (subtask.isExecuted || subtask.status === 'completed') {
        conflicts.push({
          type: 'resource_conflict',
          message: `Subtask ${subtask.jira_subtask_number || subtaskId} is already completed`,
          affectedDates: assignmentDates,
          affectedSubtasks: [subtaskId],
          severity: 'high',
          canOverride: false
        });
        continue;
      }

      // Check for existing assignments
      if (subtask.isAssigned && subtask.assignmentId) {
        const existingAssignment = task.dateAssignments.find(a => a.id === subtask.assignmentId);
        if (existingAssignment && existingAssignment.isActive) {
          const existingDates = DateRangeUtils.getAssignmentDates(existingAssignment);
          if (DateRangeUtils.doRangesOverlap(assignmentDates, existingDates)) {
            conflicts.push({
              type: 'date_overlap',
              message: `Subtask ${subtask.jira_subtask_number || subtaskId} is already assigned to overlapping dates`,
              affectedDates: existingDates.filter(date => assignmentDates.includes(date)),
              affectedSubtasks: [subtaskId],
              severity: 'medium',
              canOverride: true
            });
          }
        }
      }
    }

    // Handle conflicts if any
    if (conflicts.length > 0) {
      const highSeverityConflicts = conflicts.filter(c => c.severity === 'high' || !c.canOverride);
      if (highSeverityConflicts.length > 0) {
        console.log('[TT Assignment API] High severity conflicts found:', highSeverityConflicts);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot override conflicts',
            conflicts: highSeverityConflicts
          },
          { status: 409 }
        );
      }

      // Check if override is requested
      if (!requestBody.overrideConflicts) {
        console.log('[TT Assignment API] Conflicts found, returning for user confirmation:', conflicts);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Conflicts detected',
            conflicts: conflicts,
            requiresConfirmation: true
          },
          { status: 409 }
        );
      }
    }

    // Deactivate conflicting assignments if override is requested
    if (requestBody.overrideConflicts && conflicts.length > 0) {
      for (const conflict of conflicts) {
        for (const subtaskId of conflict.affectedSubtasks) {
          const subtask = task.subtasks.find(s => s.id === subtaskId);
          if (subtask && subtask.assignmentId) {
            const existingAssignment = task.dateAssignments.find(a => a.id === subtask.assignmentId);
            if (existingAssignment) {
              existingAssignment.isActive = false;
              console.log('[TT Assignment API] Deactivated conflicting assignment:', existingAssignment.id);
            }
          }
        }
      }
    }

    // Add the new assignment
    task.dateAssignments.push(newAssignment);
    console.log('[TT Assignment API] Created new assignment:', newAssignment.id);

    // Update subtasks with new assignment information
    let updatedSubtasks = 0;
    task.subtasks.forEach(subtask => {
      if (requestBody.subtaskIds.includes(subtask.id)) {
        // Update assignment tracking
        subtask.assignmentId = newAssignment.id;
        subtask.isAssigned = true;
        subtask.assignmentType = newAssignment.assignmentType;
        subtask.assignedStartDate = newAssignment.startDate || newAssignment.date;
        subtask.assignedEndDate = newAssignment.endDate || newAssignment.date;
        
        // Update execution status
        subtask.executionStatus = 'assigned';
        subtask.lastEditedBy = payload.username;
        subtask.updatedAt = new Date().toISOString();
        
        // Keep legacy field for backward compatibility
        subtask.assignedDate = newAssignment.startDate || newAssignment.date;
        
        updatedSubtasks++;
      }
    });
    console.log('[TT Assignment API] Updated', updatedSubtasks, 'subtasks with assignment info');

    // Update task metadata
    task.lastEditedBy = payload.username;
    task.updatedAt = new Date().toISOString();

    // Save changes
    console.log('[TT Assignment API] Saving tasks...');
    await saveTTTasks(tasks);
    console.log('[TT Assignment API] Tasks saved successfully');

    const summary = DateRangeUtils.getAssignmentSummary(newAssignment);
    return NextResponse.json({
      success: true,
      message: `${requestBody.subtaskIds.length} tasks assigned: ${summary}`,
      assignment: newAssignment,
      assignmentDates: assignmentDates
    });

  } catch (error: any) {
    console.error('[TT Assignment API] Error:', error);
    console.error('[TT Assignment API] Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove task assignment with enhanced assignment support
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TT Assignment API] DELETE request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (payload.role !== 'admin' && payload.role !== 'data_manager') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: taskId } = await params;
    const requestBody = await request.json();
    console.log('[TT Assignment API] DELETE request body:', requestBody);

    const { assignmentId, subtaskId } = requestBody;

    if (!assignmentId || !subtaskId) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and subtask ID are required' },
        { status: 400 }
      );
    }

    const { tasks } = await loadTTTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const task = tasks[taskIndex];

    if (!task.dateAssignments) {
      return NextResponse.json(
        { success: false, error: 'No assignments found' },
        { status: 404 }
      );
    }

    // Find the assignment
    const assignmentIndex = task.dateAssignments.findIndex(a => a.id === assignmentId);
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    const assignment = task.dateAssignments[assignmentIndex];

    // Remove subtask from assignment
    const subtaskIndex = assignment.subtaskIds.indexOf(subtaskId);
    if (subtaskIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Subtask not found in assignment' },
        { status: 404 }
      );
    }

    assignment.subtaskIds.splice(subtaskIndex, 1);

    // If no subtasks left in assignment, remove the entire assignment
    if (assignment.subtaskIds.length === 0) {
      task.dateAssignments.splice(assignmentIndex, 1);
      console.log('[TT Assignment API] Removed entire assignment:', assignmentId);
    } else {
      console.log('[TT Assignment API] Removed subtask from assignment, remaining subtasks:', assignment.subtaskIds.length);
    }

    // Update the subtask to remove assignment information
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.assignmentId = undefined;
      subtask.isAssigned = false;
      subtask.assignmentType = undefined;
      subtask.assignedStartDate = undefined;
      subtask.assignedEndDate = undefined;
      subtask.executionStatus = 'not_assigned';
      subtask.lastEditedBy = payload.username;
      subtask.updatedAt = new Date().toISOString();
      
      // Keep legacy field for backward compatibility
      subtask.assignedDate = undefined;
    }

    // Update task metadata
    task.lastEditedBy = payload.username;
    task.updatedAt = new Date().toISOString();

    // Save changes
    await saveTTTasks(tasks);

    return NextResponse.json({
      success: true,
      message: `Subtask removed from assignment${assignment.subtaskIds.length === 0 ? ' (assignment deleted)' : ''}`
    });

  } catch (error: any) {
    console.error('[TT Assignment API] Error in DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 