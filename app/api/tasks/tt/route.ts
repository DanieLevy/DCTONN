import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { TTTask, TaskCreationData, TTChangeLogEntry } from '@/lib/types';
import { generateId } from '@/lib/utils';
import fs from 'fs/promises';
import path from 'path';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

// Initialize TT tasks file if it doesn't exist
async function initializeTTTasksFile() {
  try {
    await fs.access(TT_TASKS_FILE);
  } catch {
    // File doesn't exist, create it
    await fs.writeFile(TT_TASKS_FILE, JSON.stringify([], null, 2));
  }
}

// Load TT tasks from file
async function loadTTTasks(): Promise<TTTask[]> {
  try {
    await initializeTTTasksFile();
    const data = await fs.readFile(TT_TASKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[TT Tasks] Error loading tasks:', error);
    return [];
  }
}

// Save TT tasks to file
async function saveTTTasks(tasks: TTTask[]): Promise<boolean> {
  try {
    await fs.writeFile(TT_TASKS_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (error) {
    console.error('[TT Tasks] Error saving tasks:', error);
    return false;
  }
}

// GET - Retrieve TT tasks
export async function GET(request: NextRequest) {
  try {
    console.log('[TT Tasks API] GET request received');
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    console.log('[TT Tasks API] User authenticated:', user.username, 'Role:', user.role, 'Permissions:', user.permissions);

    const tasks = await loadTTTasks();
    
    // Filter tasks based on user permissions
    const accessibleTasks = tasks.filter(task => {
      return user.permissions.includes(task.location);
    });

    console.log('[TT Tasks API] Loaded', tasks.length, 'total TT tasks');
    console.log('[TT Tasks API] User can access', accessibleTasks.length, 'TT tasks');

    // Apply query filters
    const url = new URL(request.url);
    let filteredTasks = accessibleTasks;

    const location = url.searchParams.get('location');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const lighting = url.searchParams.get('lighting');
    const scenario = url.searchParams.get('scenario');

    if (location && location !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.location === location);
      console.log('[TT Tasks API] Filtering by location:', location);
    }

    if (status && status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === status);
      console.log('[TT Tasks API] Filtering by status:', status);
    }

    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
      console.log('[TT Tasks API] Filtering by priority:', priority);
    }

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.csvFileName.toLowerCase().includes(searchTerm)
      );
      console.log('[TT Tasks API] Filtering by search:', searchTerm);
    }

    // TT-specific filters
    if (category && category !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.subtasks.some(subtask => subtask.category === category)
      );
      console.log('[TT Tasks API] Filtering by category:', category);
    }

    if (lighting && lighting !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.subtasks.some(subtask => subtask.lighting === lighting)
      );
      console.log('[TT Tasks API] Filtering by lighting:', lighting);
    }

    if (scenario && scenario !== 'all') {
      filteredTasks = filteredTasks.filter(task => 
        task.subtasks.some(subtask => subtask.scenario === scenario)
      );
      console.log('[TT Tasks API] Filtering by scenario:', scenario);
    }

    console.log('[TT Tasks API] Returning', filteredTasks.length, 'filtered TT tasks');

    return NextResponse.json({ 
      success: true, 
      data: filteredTasks.map(task => ({
        ...task,
        // Only include subtask count for performance, not all subtasks
        subtasks: undefined,
        subtaskCount: task.totalSubtasks
      }))
    });

  } catch (error: any) {
    console.error('[TT Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch TT tasks' },
      { status: 500 }
    );
  }
}

// POST - Create new TT task
export async function POST(request: NextRequest) {
  try {
    console.log('[TT Tasks API] POST request received');
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has permission to create tasks
    if (user.role !== 'admin' && user.role !== 'data_manager') {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions to create TT tasks' 
      }, { status: 403 });
    }

    const body = await request.json();
    const taskData: TaskCreationData = body;

    console.log('[TT Tasks API] Creating TT task:', taskData.title, 'with', taskData.subtasks.length, 'subtasks');

    // Validate required fields
    if (!taskData.title || !taskData.location || !taskData.subtasks || taskData.subtasks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: title, location, or subtasks' 
      }, { status: 400 });
    }

    // Check if user has permission for the specified location
    if (!user.permissions.includes(taskData.location)) {
      return NextResponse.json({ 
        success: false, 
        error: `You don't have permission to create tasks in ${taskData.location}` 
      }, { status: 403 });
    }

    // Create the TT task
    const now = new Date().toISOString();
    const newTask: TTTask = {
      id: generateId(),
      title: taskData.title,
      description: taskData.description,
      category: 'TT',
      location: taskData.location,
      status: 'active',
      priority: taskData.priority,
      createdBy: user.username,
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastEditedBy: user.username,
      subtasks: taskData.subtasks.map(subtask => ({
        ...subtask,
        version: 1,
        lastEditedBy: user.username
      })),
      totalSubtasks: taskData.subtasks.length,
      completedSubtasks: 0,
      csvFileName: taskData.csvFileName,
      progress: 0,
      changeLog: [{
        id: generateId(),
        timestamp: now,
        userId: user.id,
        userName: user.username,
        changeType: 'task_updated',
        targetId: '',
        targetType: 'task',
        description: `Task created with ${taskData.subtasks.length} subtasks from file: ${taskData.csvFileName}`
      }]
    };

    // Set the correct target ID after task creation
    newTask.changeLog[0].targetId = newTask.id;

    // Load existing tasks and add the new one
    const existingTasks = await loadTTTasks();
    existingTasks.push(newTask);

    // Save to file
    const saved = await saveTTTasks(existingTasks);
    if (!saved) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save TT task' 
      }, { status: 500 });
    }

    console.log('[TT Tasks API] Successfully created TT task:', newTask.id);

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: newTask.id, 
        title: newTask.title,
        totalSubtasks: newTask.totalSubtasks 
      } 
    });

  } catch (error: any) {
    console.error('[TT Tasks API] Error creating TT task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create TT task' },
      { status: 500 }
    );
  }
}

// PUT - Update TT task or subtask
export async function PUT(request: NextRequest) {
  try {
    console.log('[TT Tasks API] PUT request received');
    
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if user has permission to edit tasks
    if (user.role !== 'admin' && user.role !== 'data_manager') {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions to edit TT tasks' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { taskId, updates, updateType } = body; // updateType: 'task' | 'subtask'

    console.log('[TT Tasks API] Updating', updateType, 'for task:', taskId);

    // Load existing tasks
    const existingTasks = await loadTTTasks();
    const taskIndex = existingTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Task not found' 
      }, { status: 404 });
    }

    const task = existingTasks[taskIndex];
    
    // Check if user has permission for the task location
    if (!user.permissions.includes(task.location)) {
      return NextResponse.json({ 
        success: false, 
        error: `You don't have permission to edit tasks in ${task.location}` 
      }, { status: 403 });
    }

    const now = new Date().toISOString();
    const changeLogEntries: TTChangeLogEntry[] = [];

    if (updateType === 'task') {
      // Update task fields
      Object.keys(updates).forEach(field => {
        if (task[field as keyof TTTask] !== updates[field]) {
          const oldValue = String(task[field as keyof TTTask] || '');
          const newValue = String(updates[field] || '');
          
          changeLogEntries.push({
            id: generateId(),
            timestamp: now,
            userId: user.id,
            userName: user.username,
            changeType: 'task_updated',
            targetId: taskId,
            targetType: 'task',
            fieldChanged: field,
            oldValue,
            newValue,
            description: `Updated ${field} from "${oldValue}" to "${newValue}"`
          });
          
          (task as any)[field] = updates[field];
        }
      });

      // Update task metadata
      task.updatedAt = now;
      task.version += 1;
      task.lastEditedBy = user.username;
      
    } else if (updateType === 'subtask') {
      // Update subtask
      const { subtaskId, subtaskUpdates } = updates;
      const subtaskIndex = task.subtasks.findIndex(st => st.id === subtaskId);
      
      if (subtaskIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Subtask not found' 
        }, { status: 404 });
      }

      const subtask = task.subtasks[subtaskIndex];
      
      Object.keys(subtaskUpdates).forEach(field => {
        if (subtask[field as keyof typeof subtask] !== subtaskUpdates[field]) {
          const oldValue = String(subtask[field as keyof typeof subtask] || '');
          const newValue = String(subtaskUpdates[field] || '');
          
          changeLogEntries.push({
            id: generateId(),
            timestamp: now,
            userId: user.id,
            userName: user.username,
            changeType: 'subtask_updated',
            targetId: subtaskId,
            targetType: 'subtask',
            fieldChanged: field,
            oldValue,
            newValue,
            description: `Updated subtask ${subtask.category}-${subtask.scenario}: ${field} from "${oldValue}" to "${newValue}"`
          });
          
          (subtask as any)[field] = subtaskUpdates[field];
        }
      });

      // Update subtask metadata
      subtask.updatedAt = now;
      subtask.version += 1;
      subtask.lastEditedBy = user.username;
      
      // Update parent task metadata
      task.updatedAt = now;
      task.version += 1;
      task.lastEditedBy = user.username;
    }

    // Add change log entries
    if (changeLogEntries.length > 0) {
      task.changeLog = [...(task.changeLog || []), ...changeLogEntries];
      
      // Keep only the last 100 change log entries to prevent file size from growing too large
      if (task.changeLog.length > 100) {
        task.changeLog = task.changeLog.slice(-100);
      }
    }

    // Save updated tasks
    const saved = await saveTTTasks(existingTasks);
    if (!saved) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save updated TT task' 
      }, { status: 500 });
    }

    console.log('[TT Tasks API] Successfully updated', updateType, 'for task:', taskId, 'with', changeLogEntries.length, 'changes');

    return NextResponse.json({ 
      success: true, 
      data: { 
        taskId, 
        changesCount: changeLogEntries.length,
        newVersion: task.version
      } 
    });

  } catch (error: any) {
    console.error('[TT Tasks API] Error updating TT task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update TT task' },
      { status: 500 }
    );
  }
} 