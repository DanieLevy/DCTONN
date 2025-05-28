import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: taskId } = await params;
    console.log('[TT Task Detail] GET request received for task ID:', taskId);
    console.log('[TT Task Detail] User authenticated:', user.username, 'Role:', user.role, 'Permissions:', user.permissions);

    if (!fs.existsSync(TT_TASKS_FILE)) {
      console.log('[TT Task Detail] TT tasks file does not exist');
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);

    // The file contains a plain array of tasks, not wrapped in an object
    if (!Array.isArray(data)) {
      console.log('[TT Task Detail] Invalid TT tasks data structure - expected array, got:', typeof data);
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const task = data.find((t: any) => t.id === taskId);
    if (!task) {
      console.log('[TT Task Detail] Task not found:', taskId);
      return NextResponse.json({ success: false, error: 'TT task not found' }, { status: 404 });
    }

    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      console.log('[TT Task Detail] Access denied for user', user.username, 'to task location', task.location);
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    console.log('[TT Task Detail] Returning task with', task.subtasks?.length || 0, 'subtasks');
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('[TT Task Detail] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update TT task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'data_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();
    
    console.log(`[TT Tasks API] PUT request for task ${id} by ${user.username}`);
    
    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // The file contains a plain array of tasks, not wrapped in an object
    if (!Array.isArray(data)) {
      console.log('[TT Tasks API] Invalid TT tasks data structure - expected array, got:', typeof data);
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const taskIndex = data.findIndex((t: any) => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'TT task not found' }, { status: 404 });
    }

    const existingTask = data[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(existingTask.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Update task
    const updatedTask = {
      ...existingTask,
      ...updates,
      id: existingTask.id, // Preserve original ID
      createdAt: existingTask.createdAt, // Preserve creation date
      createdBy: existingTask.createdBy, // Preserve creator
      updatedAt: new Date().toISOString(),
      lastEditedBy: user.username
    };

    data[taskIndex] = updatedTask;

    // Write back to file
    fs.writeFileSync(TT_TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[TT Tasks API] Task ${id} updated by ${user.username}`);
    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('[TT Tasks API] Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE TT task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'data_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    console.log(`[TT Tasks API] DELETE request for task ${id} by ${user.username}`);
    
    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // The file contains a plain array of tasks, not wrapped in an object
    if (!Array.isArray(data)) {
      console.log('[TT Tasks API] Invalid TT tasks data structure - expected array, got:', typeof data);
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const taskIndex = data.findIndex((t: any) => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'TT task not found' }, { status: 404 });
    }

    const task = data[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Remove task
    data.splice(taskIndex, 1);

    // Write back to file
    fs.writeFileSync(TT_TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[TT Tasks API] Task ${id} deleted by ${user.username}`);
    return NextResponse.json({ success: true, message: 'TT task deleted successfully' });
  } catch (error) {
    console.error('[TT Tasks API] Error deleting task:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 