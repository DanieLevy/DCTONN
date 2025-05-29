import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { VehicleSessionData } from '@/lib/vehicle-types';
import path from 'path';
import fs from 'fs';

const TT_TASKS_FILE = path.join(process.cwd(), 'data', 'tt-tasks.json');

export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request);
    if (!user || (user.role !== 'admin' && user.role !== 'data_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { vehicleData, taskId } = await request.json();
    
    console.log('[Process Vehicle Data API] Processing vehicle data for task:', taskId);
    
    if (!vehicleData || !taskId) {
      return NextResponse.json({ success: false, error: 'Missing vehicle data or task ID' }, { status: 400 });
    }

    if (!fs.existsSync(TT_TASKS_FILE)) {
      return NextResponse.json({ success: false, error: 'TT tasks file not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(TT_TASKS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ success: false, error: 'Invalid TT tasks data' }, { status: 500 });
    }

    const taskIndex = data.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const task = data[taskIndex];
    
    // Check user permissions
    const userPermissions = user.permissions || [user.location];
    if (!userPermissions.includes(task.location)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Extract all subtasks from vehicle data with their session information
    const subtaskSessionMap = new Map<string, any>();
    
    for (const disk of vehicleData.disks) {
      for (const sessionGroup of disk.sessions) {
        for (const [sessionName, sessionData] of Object.entries(sessionGroup)) {
          const typedSessionData = sessionData as VehicleSessionData;
          for (const subtaskNumber of typedSessionData.subtasks) {
            subtaskSessionMap.set(subtaskNumber, {
              diskId: disk.id,
              sessionName,
              drops: typedSessionData.drops,
              cores: typedSessionData.cores,
              sessionData: typedSessionData
            });
          }
        }
      }
    }

    const processedSubtasks: any[] = [];
    const now = new Date().toISOString();
    
    // Process each subtask
    if (task.subtasks && Array.isArray(task.subtasks)) {
      for (const subtask of task.subtasks) {
        if (subtask.jira_subtask_number && subtaskSessionMap.has(subtask.jira_subtask_number)) {
          const sessionInfo = subtaskSessionMap.get(subtask.jira_subtask_number);
          
          // Mark subtask as executed/completed
          subtask.isExecuted = true;
          subtask.status = 'completed';
          subtask.executionStatus = 'executed';
          subtask.executionDate = now;
          subtask.executionNotes = `Processed from vehicle data scan - Disk: ${sessionInfo.diskId}, Session: ${sessionInfo.sessionName}`;
          subtask.updatedAt = now;
          subtask.lastEditedBy = user.username;
          
          // Add vehicle data metadata
          subtask.vehicleDataMetadata = {
            diskId: sessionInfo.diskId,
            sessionName: sessionInfo.sessionName,
            drops: sessionInfo.drops,
            cores: sessionInfo.cores,
            processedAt: now,
            processedBy: user.username
          };
          
          processedSubtasks.push({
            subtaskId: subtask.id,
            jiraNumber: subtask.jira_subtask_number,
            sessionInfo
          });
        }
      }
    }

    // Add vehicle data to task
    if (!task.vehicleDataScans) {
      task.vehicleDataScans = [];
    }
    
    task.vehicleDataScans.push({
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scannedAt: now,
      scannedBy: user.username,
      vehicleData: vehicleData,
      processedSubtasks: processedSubtasks.length,
      subtaskNumbers: Array.from(subtaskSessionMap.keys())
    });

    // Recalculate task progress
    const completedSubtasks = task.subtasks.filter((s: any) => s.isExecuted || s.status === 'completed').length;
    const totalSubtasks = task.subtasks.length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    // Update task metadata
    task.completedSubtasks = completedSubtasks;
    task.progress = progress;
    task.updatedAt = now;
    task.lastEditedBy = user.username;

    // Add change log entry
    if (!task.changeLog) {
      task.changeLog = [];
    }
    
    task.changeLog.push({
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      userId: user.userId || user.username,
      userName: user.username,
      changeType: 'task_updated',
      targetId: taskId,
      targetType: 'task',
      description: `Vehicle data processed: ${processedSubtasks.length} subtasks marked as completed from QR scan`
    });

    // Save changes
    fs.writeFileSync(TT_TASKS_FILE, JSON.stringify(data, null, 2));

    console.log('[Process Vehicle Data API] Successfully processed', processedSubtasks.length, 'subtasks');
    
    return NextResponse.json({
      success: true,
      data: {
        processedSubtasks: processedSubtasks.length,
        taskProgress: { completedSubtasks, totalSubtasks, progress },
        processedItems: processedSubtasks
      },
      message: `Successfully processed ${processedSubtasks.length} subtasks from vehicle data`
    });

  } catch (error: any) {
    console.error('[Process Vehicle Data API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process vehicle data' },
      { status: 500 }
    );
  }
} 