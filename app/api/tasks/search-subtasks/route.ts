import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { subtaskNumbers } = await request.json();
    
    console.log('[Subtask Search API] Searching for subtasks:', subtaskNumbers);
    
    if (!Array.isArray(subtaskNumbers) || subtaskNumbers.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid subtask numbers' }, { status: 400 });
    }

    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const userPermissions = user.permissions || [user.location];
    const matchingResults: any[] = [];

    // Search through all tasks
    for (const task of data) {
      // Check user permissions
      if (!userPermissions.includes(task.location)) {
        continue;
      }

      if (!task.subtasks || !Array.isArray(task.subtasks)) {
        continue;
      }

      const taskMatches: any[] = [];

      // Search for matching subtasks within this task
      for (const subtask of task.subtasks) {
        if (subtask.jira_subtask_number && subtaskNumbers.includes(subtask.jira_subtask_number)) {
          taskMatches.push({
            subtaskId: subtask.id,
            jiraNumber: subtask.jira_subtask_number,
            category: subtask.category,
            scenario: subtask.scenario,
            lighting: subtask.lighting,
            status: subtask.status,
            isExecuted: subtask.isExecuted || false,
            executionStatus: subtask.executionStatus || 'not_assigned'
          });
        }
      }

      if (taskMatches.length > 0) {
        matchingResults.push({
          taskId: task.id,
          taskTitle: task.title,
          taskLocation: task.location,
          matchingSubtasks: taskMatches,
          totalMatches: taskMatches.length
        });
      }
    }

    console.log('[Subtask Search API] Found matches in', matchingResults.length, 'tasks');
    
    return NextResponse.json({
      success: true,
      data: {
        searchedSubtasks: subtaskNumbers,
        matchingTasks: matchingResults,
        totalMatches: matchingResults.reduce((sum, task) => sum + task.totalMatches, 0)
      }
    });

  } catch (error: any) {
    console.error('[Subtask Search API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search subtasks' },
      { status: 500 }
    );
  }
} 