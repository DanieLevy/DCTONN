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