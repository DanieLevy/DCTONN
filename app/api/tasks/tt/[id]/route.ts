import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { TTTask } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

// Load TT tasks from file
async function loadTTTasks(): Promise<TTTask[]> {
  try {
    const data = await fs.readFile(TT_TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[TT Task Detail] Error loading tasks:', error);
    return [];
  }
}

// GET - Retrieve specific TT task with full details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('[TT Task Detail] GET request received for task ID:', id);
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    console.log('[TT Task Detail] User authenticated:', user.username, 'Role:', user.role, 'Permissions:', user.permissions);

    const tasks = await loadTTTasks();
    
    // Find the specific task
    const task = tasks.find(t => t.id === id);
    
    if (!task) {
      console.log('[TT Task Detail] Task not found:', id);
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    // Check if user has permission to access this task's location
    if (!user.permissions.includes(task.location)) {
      console.log('[TT Task Detail] User does not have permission for location:', task.location);
      return NextResponse.json({ 
        success: false, 
        error: `You don't have permission to access tasks in ${task.location}` 
      }, { status: 403 });
    }

    console.log('[TT Task Detail] Returning task with', task.subtasks.length, 'subtasks');

    return NextResponse.json({ 
      success: true, 
      data: task
    });

  } catch (error: any) {
    console.error('[TT Task Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch TT task details' },
      { status: 500 }
    );
  }
} 