import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const TASKS_FILE = path.join(process.cwd(), 'data', 'tasks.json');

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!fs.existsSync(TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'Tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    const task = data.tasks?.find((t: any) => t.id === id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update task
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
    
    if (!fs.existsSync(TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'Tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    const taskIndex = data.tasks?.findIndex((t: any) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const existingTask = data.tasks[taskIndex];
    
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

    data.tasks[taskIndex] = updatedTask;

    // Write back to file
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[Tasks API] Task ${id} updated by ${user.username}`);
    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE task
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
    
    if (!fs.existsSync(TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'Tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    const taskIndex = data.tasks?.findIndex((t: any) => t.id === id);

    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = data.tasks[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Remove task
    data.tasks.splice(taskIndex, 1);

    // Write back to file
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));

    console.log(`[Tasks API] Task ${id} deleted by ${user.username}`);
    return NextResponse.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
} 