import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadTTTasks, saveTTTasks } from '@/lib/tt-data-store';
import { DateAssignment } from '@/lib/types';

// POST - Assign tasks to a date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TT Assignment API] POST request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
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
    const { date, subtaskIds, notes } = await request.json();

    if (!date || !Array.isArray(subtaskIds) || subtaskIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Date and subtask IDs are required' },
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

    // Initialize dateAssignments if it doesn't exist
    if (!task.dateAssignments) {
      task.dateAssignments = [];
    }

    // Check if assignment for this date already exists
    const existingAssignmentIndex = task.dateAssignments.findIndex(a => a.date === date);
    
    if (existingAssignmentIndex >= 0) {
      // Update existing assignment
      const existingAssignment = task.dateAssignments[existingAssignmentIndex];
      const newSubtaskIds = [...new Set([...existingAssignment.subtaskIds, ...subtaskIds])];
      
      task.dateAssignments[existingAssignmentIndex] = {
        ...existingAssignment,
        subtaskIds: newSubtaskIds,
        assignedBy: payload.username,
        assignedAt: new Date().toISOString(),
        notes: notes || existingAssignment.notes
      };
    } else {
      // Create new assignment
      const newAssignment: DateAssignment = {
        date,
        subtaskIds,
        assignedBy: payload.username,
        assignedAt: new Date().toISOString(),
        notes
      };
      
      task.dateAssignments.push(newAssignment);
    }

    // Update subtasks with assignment information
    task.subtasks.forEach(subtask => {
      if (subtaskIds.includes(subtask.id)) {
        subtask.assignedDate = date;
        subtask.isAssigned = true;
        subtask.executionStatus = 'assigned';
        subtask.lastEditedBy = payload.username;
        subtask.updatedAt = new Date().toISOString();
      }
    });

    // Update task metadata
    task.lastEditedBy = payload.username;
    task.updatedAt = new Date().toISOString();

    // Save changes
    await saveTTTasks(tasks);

    console.log('[TT Assignment API] Tasks assigned successfully');

    return NextResponse.json({
      success: true,
      message: `${subtaskIds.length} tasks assigned to ${date}`,
    });

  } catch (error: any) {
    console.error('[TT Assignment API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TT Assignment API] DELETE request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload) {
      console.log('[TT Assignment API] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admins and data managers can remove assignments
    if (payload.role !== 'admin' && payload.role !== 'data_manager') {
      console.log('[TT Assignment API] Insufficient permissions');
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: taskId } = await params;
    const { date, subtaskId } = await request.json();

    if (!date || !subtaskId) {
      return NextResponse.json(
        { success: false, error: 'Date and subtask ID are required' },
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
        { success: false, error: 'No assignments found for this task' },
        { status: 404 }
      );
    }

    // Find and update the assignment
    const assignmentIndex = task.dateAssignments.findIndex(a => a.date === date);
    
    if (assignmentIndex >= 0) {
      const assignment = task.dateAssignments[assignmentIndex];
      assignment.subtaskIds = assignment.subtaskIds.filter(id => id !== subtaskId);
      
      // Remove the assignment if no subtasks left
      if (assignment.subtaskIds.length === 0) {
        task.dateAssignments.splice(assignmentIndex, 1);
      }
    }

    // Update the subtask
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      delete subtask.assignedDate;
      subtask.isAssigned = false;
      subtask.executionStatus = 'not_assigned';
      subtask.lastEditedBy = payload.username;
      subtask.updatedAt = new Date().toISOString();
    }

    // Update task metadata
    task.lastEditedBy = payload.username;
    task.updatedAt = new Date().toISOString();

    // Save changes
    await saveTTTasks(tasks);

    console.log('[TT Assignment API] Assignment removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully',
    });

  } catch (error: any) {
    console.error('[TT Assignment API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 