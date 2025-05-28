import { promises as fs } from 'fs';
import path from 'path';
import { Task, User, Location } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface DatabaseData {
  tasks: Task[];
  users: User[];
  locations: Location[];
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