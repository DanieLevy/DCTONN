import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest, canAccessCountry, canManageTasks } from '@/lib/auth';
import { loadTasks, saveTasks, generateId } from '@/lib/data-store';
import { Task } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('[Tasks API] GET request received');
    
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload) {
      console.log('[Tasks API] Unauthorized request - invalid token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Tasks API] User authenticated:', payload.username, 'Role:', payload.role, 'Permissions:', payload.permissions);

    const allTasks = await loadTasks();
    console.log('[Tasks API] Loaded', allTasks.length, 'total tasks');
    
    // Filter tasks based on user permissions
    const filteredTasks = allTasks.filter(task => canAccessCountry(payload, task.location));
    console.log('[Tasks API] User can access', filteredTasks.length, 'tasks');

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const categoryFilter = searchParams.get('category');
    const locationFilter = searchParams.get('location');
    const priorityFilter = searchParams.get('priority');
    const statusFilter = searchParams.get('status');
    const typeFilter = searchParams.get('type');

    let tasks = filteredTasks;

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      console.log('[Tasks API] Filtering by category:', categoryFilter);
      tasks = tasks.filter(task => task.category === categoryFilter);
      console.log('[Tasks API] Category filtered to', tasks.length, 'tasks');
    }

    // Apply location filter
    if (locationFilter && locationFilter !== 'all') {
      console.log('[Tasks API] Filtering by location:', locationFilter);
      tasks = tasks.filter(task => task.location === locationFilter);
      console.log('[Tasks API] Location filtered to', tasks.length, 'tasks');
    }

    // Apply priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      console.log('[Tasks API] Filtering by priority:', priorityFilter);
      tasks = tasks.filter(task => task.priority === priorityFilter);
      console.log('[Tasks API] Priority filtered to', tasks.length, 'tasks');
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      console.log('[Tasks API] Filtering by status:', statusFilter);
      tasks = tasks.filter(task => task.status === statusFilter);
      console.log('[Tasks API] Status filtered to', tasks.length, 'tasks');
    }

    // Apply type filter
    if (typeFilter && typeFilter !== 'all') {
      console.log('[Tasks API] Filtering by type:', typeFilter);
      tasks = tasks.filter(task => task.type === typeFilter);
      console.log('[Tasks API] Type filtered to', tasks.length, 'tasks');
    }

    // Apply search filter
    if (searchQuery) {
      console.log('[Tasks API] Filtering by search query:', searchQuery);
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.type.toLowerCase().includes(query) ||
        task.targetCar.toLowerCase().includes(query) ||
        task.location.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query) ||
        task.executionLocation.toLowerCase().includes(query) ||
        task.labels.some(label => label.toLowerCase().includes(query))
      );
      console.log('[Tasks API] Search filtered to', tasks.length, 'tasks');
    }

    return NextResponse.json({
      success: true,
      data: tasks,
    });

  } catch (error: any) {
    console.error('[Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token || '');
    
    if (!payload || !canManageTasks(payload)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Data manager or admin access required' },
        { status: 403 }
      );
    }

    const taskData = await request.json();
    
    // Ensure data managers can only create tasks for countries they have permission to
    if (payload.role === 'data_manager' && !canAccessCountry(payload, taskData.location)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You can only create tasks for countries you have permission to access' },
        { status: 403 }
      );
    }
    
    const newTask: Task = {
      id: generateId(),
      ...taskData,
      createdBy: payload.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tasks = await loadTasks();
    tasks.push(newTask);
    await saveTasks(tasks);

    return NextResponse.json({
      success: true,
      data: newTask,
    });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 