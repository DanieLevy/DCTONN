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
  
  // Enhanced execution tracking fields
  isExecuted?: boolean; // Whether the subtask has been executed
  executionDate?: string; // When it was actually executed
  executionNotes?: string; // Notes about execution
  executionStatus?: 'not_assigned' | 'assigned' | 'in_execution' | 'executed' | 'failed_execution';
  
  // Enhanced assignment tracking with duration support
  isAssigned?: boolean; // Quick check if assigned to any date
  assignmentId?: string; // Reference to DateAssignment ID
  assignedStartDate?: string; // Start date of assignment (ISO date string)
  assignedEndDate?: string; // End date of assignment (ISO date string)
  assignmentType?: 'single_day' | 'date_range' | 'duration_days'; // Type of assignment
  assignmentConflict?: boolean; // Flag for potential conflicts
  
  // Deprecated - keeping for backward compatibility
  assignedDate?: string; // Legacy single date assignment
}

// New interface for date assignments with duration support
export interface DateAssignment {
  id: string; // Unique assignment ID
  assignmentType: 'single_day' | 'date_range' | 'duration_days'; // Type of assignment
  
  // Single day assignment
  date?: string; // ISO date string (YYYY-MM-DD) for single day assignments
  
  // Date range assignment
  startDate?: string; // ISO date string for range start
  endDate?: string; // ISO date string for range end
  
  // Duration assignment
  durationDays?: number; // Number of days from start date
  
  subtaskIds: string[];
  assignedBy: string;
  assignedAt: string;
  notes?: string;
  
  // Metadata
  title?: string; // Assignment title/description
  isActive: boolean; // Whether assignment is currently active
  estimatedEffort?: number; // Estimated hours/effort
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
  
  // New date assignments tracking
  dateAssignments?: DateAssignment[];
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

// Utility functions for date range handling
export class DateRangeUtils {
  /**
   * Generate all dates in a range (inclusive)
   */
  static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    
    return dates;
  }
  
  /**
   * Generate dates from start date + duration
   */
  static getDateRangeFromDuration(startDate: string, durationDays: number): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < durationDays; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      dates.push(current.toISOString().split('T')[0]);
    }
    
    return dates;
  }
  
  /**
   * Get all dates covered by an assignment
   */
  static getAssignmentDates(assignment: DateAssignment): string[] {
    switch (assignment.assignmentType) {
      case 'single_day':
        return assignment.date ? [assignment.date] : [];
      
      case 'date_range':
        if (assignment.startDate && assignment.endDate) {
          return this.getDateRange(assignment.startDate, assignment.endDate);
        }
        return [];
      
      case 'duration_days':
        if (assignment.startDate && assignment.durationDays) {
          return this.getDateRangeFromDuration(assignment.startDate, assignment.durationDays);
        }
        return [];
      
      default:
        return [];
    }
  }
  
  /**
   * Check if two date ranges overlap
   */
  static doRangesOverlap(range1: string[], range2: string[]): boolean {
    return range1.some(date => range2.includes(date));
  }
  
  /**
   * Get assignment title/summary
   */
  static getAssignmentSummary(assignment: DateAssignment): string {
    switch (assignment.assignmentType) {
      case 'single_day':
        return `Single day: ${assignment.date}`;
      
      case 'date_range':
        return `Range: ${assignment.startDate} to ${assignment.endDate}`;
      
      case 'duration_days':
        return `${assignment.durationDays} days from ${assignment.startDate}`;
      
      default:
        return 'Unknown assignment type';
    }
  }
}

// Assignment validation types
export interface AssignmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: AssignmentConflict[];
}

export interface AssignmentConflict {
  type: 'date_overlap' | 'capacity_exceed' | 'resource_conflict';
  message: string;
  affectedDates: string[];
  affectedSubtasks: string[];
  severity: 'low' | 'medium' | 'high';
  canOverride: boolean;
} 