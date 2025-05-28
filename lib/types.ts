export interface Task {
  id: string;
  category: 'DC' | 'TT'; // Data Collection or Test Track
  title: string;
  type: string;
  labels: string[];
  illumination: string;
  weather: string;
  roadType: string;
  project: string;
  targetCar: string;
  location: 'EU' | 'USA' | 'IL';
  priority: 'high' | 'medium' | 'low';
  extraSensor: string;
  datacoNumber: string;
  executionDetails: string;
  executionLocation: string;
  exampleImages: string[];
  additionalInfo: string;
  status: 'active' | 'paused' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'data_manager' | 'viewer';
  location: 'EU' | 'USA' | 'IL';
  permissions: string[]; // Array of country codes the user can access
  hashedPassword: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Location {
  code: 'EU' | 'USA' | 'IL';
  name: string;
  dataManager: string;
  taskCount: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TaskFilters {
  location?: string;
  priority?: string;
  status?: string;
  type?: string;
  search?: string;
  category?: string;
  lighting?: string;
  scenario?: string;
}

// Test Track (TT) specific types
export interface TTSubtask {
  id: string;
  category: string;
  regulation: string;
  scenario: string;
  lighting: string;
  street_lights: string;
  beam: string;
  overlap: string;
  target_speed: string;
  ego_speed: string;
  number_of_runs: string;
  headway: string;
  brake: string;
  priority: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedRuns?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  version: number; // Version tracking for subtasks
  lastEditedBy?: string; // Who made the last edit
  jira_subtask_number?: string; // JIRA subtask number (DATACO-XXXXX)
}

export interface TTTask {
  id: string;
  title: string;
  description?: string;
  category: 'TT';
  location: string;
  status: 'active' | 'paused' | 'completed';
  priority: 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number; // Version tracking for the task
  lastEditedBy?: string; // Who made the last edit
  
  // TT specific fields
  subtasks: TTSubtask[];
  totalSubtasks: number;
  completedSubtasks: number;
  csvFileName: string;
  progress: number; // percentage 0-100
  
  // Change tracking
  changeLog: TTChangeLogEntry[];
}

// Change log entry interface
export interface TTChangeLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  changeType: 'task_updated' | 'subtask_updated' | 'subtask_added' | 'subtask_deleted' | 'status_changed';
  targetId: string; // Task ID or Subtask ID
  targetType: 'task' | 'subtask';
  fieldChanged?: string; // Which field was changed
  oldValue?: string; // Previous value
  newValue?: string; // New value
  description: string; // Human readable description
}

// CSV Column validation
export interface CSVColumnMapping {
  category: number;      // Column A (0)
  regulation: number;    // Column B (1)
  scenario: number;      // Column C (2)
  lighting: number;      // Column D (3)
  street_lights: number; // Column E (4)
  beam: number;          // Column F (5)
  overlap: number;       // Column G (6)
  target_speed: number;  // Column H (7)
  ego_speed: number;     // Column I (8)
  number_of_runs: number;// Column J (9)
  headway: number;       // Column K (10)
  brake: number;         // Column L (11)
  priority: number;      // Column M (12)
}

export const REQUIRED_CSV_COLUMNS: (keyof CSVColumnMapping)[] = [
  'category', 'regulation', 'scenario', 'lighting', 'street_lights',
  'beam', 'overlap', 'target_speed', 'ego_speed', 'number_of_runs',
  'headway', 'brake', 'priority'
];

// File upload types
export interface FileUploadResult {
  success: boolean;
  data?: TTSubtask[];
  error?: string;
  fileName?: string;
  totalRows?: number;
}

export interface TaskCreationData {
  title: string;
  description?: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  version: string;
  subtasks: TTSubtask[];
  csvFileName: string;
} 