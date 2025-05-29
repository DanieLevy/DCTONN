// Vehicle data structure interfaces for QR code scanning

export interface VehicleSessionData {
  subtasks: string[];
  drops: number;
  cores: number;
}

export interface VehicleSession {
  [sessionName: string]: VehicleSessionData;
}

export interface VehicleDisk {
  id: string;
  sessions: VehicleSession[];
}

export interface VehicleData {
  disks: VehicleDisk[];
}

// Utility functions for vehicle data validation
export function isValidVehicleData(data: any): data is VehicleData {
  if (!data || typeof data !== 'object') return false;
  if (!data.disks || !Array.isArray(data.disks)) return false;
  
  return data.disks.every((disk: any) => 
    disk.id && 
    typeof disk.id === 'string' &&
    disk.sessions && 
    Array.isArray(disk.sessions) &&
    disk.sessions.every((session: any) => {
      const sessionKeys = Object.keys(session);
      if (sessionKeys.length !== 1) return false;
      const sessionData = session[sessionKeys[0]];
      return sessionData && 
             Array.isArray(sessionData.subtasks) &&
             sessionData.subtasks.every((s: any) => typeof s === 'string') &&
             typeof sessionData.drops === 'number' &&
             typeof sessionData.cores === 'number';
    })
  );
}

/**
 * Utility function to calculate statistics from vehicle data
 */
export function getVehicleDataStats(data: VehicleData): {
  totalDisks: number;
  totalSessions: number;
  totalSubtasks: number;
  totalDrops: number;
  totalCores: number;
} {
  let totalSessions = 0;
  let totalSubtasks = 0;
  let totalDrops = 0;
  let totalCores = 0;

  for (const disk of data.disks) {
    totalSessions += disk.sessions.length;
    
    for (const sessionGroup of disk.sessions) {
      for (const [sessionName, sessionData] of Object.entries(sessionGroup)) {
        totalSubtasks += sessionData.subtasks.length;
        totalDrops += sessionData.drops;
        totalCores += sessionData.cores;
      }
    }
  }

  return {
    totalDisks: data.disks.length,
    totalSessions,
    totalSubtasks,
    totalDrops,
    totalCores
  };
} 