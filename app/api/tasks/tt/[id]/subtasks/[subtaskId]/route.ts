import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

// PUT update subtask
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'data_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;
    const updates = await request.json();
    
    console.log(`[TT Subtasks API] PUT request for subtask ${subtaskId} in task ${taskId} by ${user.username}`);
    
    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.ttTasks || !Array.isArray(data.ttTasks)) {
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const taskIndex = data.ttTasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'TT task not found' }, { status: 404 });
    }

    const task = data.ttTasks[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Find and update subtask
    if (!task.subtasks || !Array.isArray(task.subtasks)) {
      return NextResponse.json({ success: false, error: 'No subtasks found' }, { status: 404 });
    }

    const subtaskIndex = task.subtasks.findIndex((s: any) => s.id === subtaskId);
    if (subtaskIndex === -1) {
      return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 });
    }

    const existingSubtask = task.subtasks[subtaskIndex];
    
    // Update subtask
    const updatedSubtask = {
      ...existingSubtask,
      ...updates,
      id: existingSubtask.id, // Preserve original ID
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.username
    };

    task.subtasks[subtaskIndex] = updatedSubtask;

    // Recalculate task progress
    const completedSubtasks = task.subtasks.filter((s: any) => s.status === 'completed').length;
    const totalSubtasks = task.subtasks.length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Update task metadata
    data.ttTasks[taskIndex] = {
      ...task,
      completedSubtasks,
      totalSubtasks,
      progress,
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.username
    };

    // Write back to file
    fs.writeFileSync(TT_TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[TT Subtasks API] Subtask ${subtaskId} updated by ${user.username}`);
    return NextResponse.json({ 
      success: true, 
      data: updatedSubtask,
      taskProgress: { completedSubtasks, totalSubtasks, progress }
    });
  } catch (error) {
    console.error('[TT Subtasks API] Error updating subtask:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'data_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;
    
    console.log(`[TT Subtasks API] DELETE request for subtask ${subtaskId} in task ${taskId} by ${user.username}`);
    
    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.ttTasks || !Array.isArray(data.ttTasks)) {
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const taskIndex = data.ttTasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'TT task not found' }, { status: 404 });
    }

    const task = data.ttTasks[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Find and remove subtask
    if (!task.subtasks || !Array.isArray(task.subtasks)) {
      return NextResponse.json({ success: false, error: 'No subtasks found' }, { status: 404 });
    }

    const subtaskIndex = task.subtasks.findIndex((s: any) => s.id === subtaskId);
    if (subtaskIndex === -1) {
      return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 });
    }

    // Remove subtask
    task.subtasks.splice(subtaskIndex, 1);

    // Recalculate task progress
    const completedSubtasks = task.subtasks.filter((s: any) => s.status === 'completed').length;
    const totalSubtasks = task.subtasks.length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Update task metadata
    data.ttTasks[taskIndex] = {
      ...task,
      completedSubtasks,
      totalSubtasks,
      progress,
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.username
    };

    // Write back to file
    fs.writeFileSync(TT_TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[TT Subtasks API] Subtask ${subtaskId} deleted by ${user.username}`);
    return NextResponse.json({ 
      success: true, 
      message: 'Subtask deleted successfully',
      taskProgress: { completedSubtasks, totalSubtasks, progress }
    });
  } catch (error) {
    console.error('[TT Subtasks API] Error deleting subtask:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 