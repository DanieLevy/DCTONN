import { promises as fs } from 'fs';
import path from 'path';
import { Task, User, Location, TTTask } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface DatabaseData {
  tasks: Task[];
  users: User[];
  locations: Location[];
}

export interface TTDatabaseData {
  tasks: TTTask[];
}

export async function loadTasks(): Promise<Task[]> {
  try {
    const filePath = path.join(DATA_DIR, 'tasks.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    const filePath = path.join(DATA_DIR, 'tasks.json');
    const data = { tasks };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw new Error('Failed to save tasks');
  }
}

export async function loadUsers(): Promise<{ users: User[], locations: Location[] }> {
  try {
    const filePath = path.join(DATA_DIR, 'users.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return { 
      users: data.users || [], 
      locations: data.locations || [] 
    };
  } catch (error) {
    console.error('Error loading users:', error);
    return { users: [], locations: [] };
  }
}

export async function saveUsers(users: User[], locations: Location[]): Promise<void> {
  try {
    const filePath = path.join(DATA_DIR, 'users.json');
    const data = { users, locations };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw new Error('Failed to save users');
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function loadTTTasks(): Promise<{ tasks: TTTask[] }> {
  try {
    const filePath = path.join(DATA_DIR, 'tt-tasks.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Handle both formats: array or object with tasks property
    if (Array.isArray(data)) {
      console.log('[Data Store] TT tasks loaded as array format');
      return { tasks: data };
    } else if (data.tasks && Array.isArray(data.tasks)) {
      console.log('[Data Store] TT tasks loaded as object format');
      return { tasks: data.tasks };
    } else {
      console.log('[Data Store] No TT tasks found in file');
      return { tasks: [] };
    }
  } catch (error) {
    console.error('Error loading TT tasks:', error);
    return { tasks: [] };
  }
}

export async function saveTTTasks(tasks: TTTask[]): Promise<void> {
  try {
    const filePath = path.join(DATA_DIR, 'tt-tasks.json');
    
    // Check current format before saving
    let currentFormat = 'array'; // default to array
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existingData = JSON.parse(existingContent);
      if (!Array.isArray(existingData) && existingData.tasks) {
        currentFormat = 'object';
      }
    } catch {
      // File doesn't exist or is invalid, use array format
    }
    
    // Save in the same format as currently exists
    const dataToSave = currentFormat === 'array' ? tasks : { tasks };
    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
    console.log('[Data Store] TT tasks saved successfully in', currentFormat, 'format');
  } catch (error) {
    console.error('Error saving TT tasks:', error);
    throw new Error('Failed to save TT tasks');
  }
}

export async function loadAgentRules(): Promise<string> {
  try {
    const filePath = path.join(DATA_DIR, 'AgentRules.txt');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return fileContent;
  } catch (error) {
    console.error('Error loading agent rules:', error);
    return '';
  }
}

export interface ComprehensiveAIData {
  dcTasks: Task[];
  ttTasks: TTTask[];
  allSubtasks: any[];
  users: User[];
  locations: Location[];
  agentRules: string;
  statistics: {
    totalDCTasks: number;
    totalTTTasks: number;
    totalSubtasks: number;
    completedSubtasks: number;
    activeSubtasks: number;
    pendingSubtasks: number;
    completionRate: number;
    locationBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    scenarioBreakdown: Record<string, number>;
    lightingBreakdown: Record<string, number>;
  };
}

export async function loadComprehensiveAIData(): Promise<ComprehensiveAIData> {
  try {
    console.log('[Data Store] Loading comprehensive AI data...');
    
    const [dcTasks, ttTasksData, usersData, agentRules] = await Promise.all([
      loadTasks(),
      loadTTTasks(),
      loadUsers(),
      loadAgentRules()
    ]);

    const ttTasks = ttTasksData.tasks;
    const allSubtasks = ttTasks.flatMap(tt => tt.subtasks || []);
    
    // Calculate comprehensive statistics
    const completedSubtasks = allSubtasks.filter(st => st.isExecuted || st.status === 'completed');
    const activeSubtasks = allSubtasks.filter(st => st.status === 'in_progress' || st.isAssigned);
    const pendingSubtasks = allSubtasks.filter(st => st.status === 'pending');
    
    const locationBreakdown = dcTasks.reduce((acc, task) => {
      acc[task.location] = (acc[task.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const priorityBreakdown = [...dcTasks, ...allSubtasks].reduce((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryBreakdown = allSubtasks.reduce((acc, st) => {
      acc[st.category] = (acc[st.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const scenarioBreakdown = allSubtasks.reduce((acc, st) => {
      if (st.scenario) {
        acc[st.scenario] = (acc[st.scenario] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const lightingBreakdown = allSubtasks.reduce((acc, st) => {
      if (st.lighting) {
        acc[st.lighting] = (acc[st.lighting] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const result: ComprehensiveAIData = {
      dcTasks,
      ttTasks,
      allSubtasks,
      users: usersData.users,
      locations: usersData.locations,
      agentRules,
      statistics: {
        totalDCTasks: dcTasks.length,
        totalTTTasks: ttTasks.length,
        totalSubtasks: allSubtasks.length,
        completedSubtasks: completedSubtasks.length,
        activeSubtasks: activeSubtasks.length,
        pendingSubtasks: pendingSubtasks.length,
        completionRate: allSubtasks.length > 0 ? (completedSubtasks.length / allSubtasks.length) * 100 : 0,
        locationBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        scenarioBreakdown,
        lightingBreakdown
      }
    };

    console.log('[Data Store] Comprehensive AI data loaded:', {
      dcTasks: result.dcTasks.length,
      ttTasks: result.ttTasks.length,
      subtasks: result.allSubtasks.length,
      users: result.users.length
    });

    return result;
  } catch (error) {
    console.error('Error loading comprehensive AI data:', error);
    throw new Error('Failed to load comprehensive AI data');
  }
} 