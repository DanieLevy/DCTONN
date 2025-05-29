'use client';

import { useEffect, useState } from 'react';
import { X, ChevronDown, ChevronRight, Database, MapPin, Calendar, Users, Zap, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { VehicleData, getVehicleDataStats } from '@/lib/vehicle-types';
import { useAuth } from '@/lib/auth-context';

interface VehicleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VehicleData | null;
  rawQRContent?: string | null;
}

interface MatchingTask {
  taskId: string;
  taskTitle: string;
  taskLocation: string;
  matchingSubtasks: Array<{
    subtaskId: string;
    jiraNumber: string;
    category: string;
    scenario: string;
    lighting: string;
    status: string;
    isExecuted: boolean;
    executionStatus: string;
  }>;
  totalMatches: number;
}

interface SearchResults {
  searchedSubtasks: string[];
  matchingTasks: MatchingTask[];
  totalMatches: number;
}

export function VehicleDataModal({ isOpen, onClose, data, rawQRContent }: VehicleDataModalProps) {
  const { user, token } = useAuth();
  const [expandedDisks, setExpandedDisks] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showTaskSelection, setShowTaskSelection] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      searchForMatchingTasks();
    }
  }, [isOpen, data]);

  const searchForMatchingTasks = async () => {
    if (!data || !token) return;

    setIsSearching(true);
    try {
      // Extract all subtask numbers from vehicle data
      const subtaskNumbers: string[] = [];
      for (const disk of data.disks) {
        for (const sessionGroup of disk.sessions) {
          for (const [sessionName, sessionData] of Object.entries(sessionGroup)) {
            subtaskNumbers.push(...sessionData.subtasks);
          }
        }
      }

      console.log('[Vehicle Modal] Searching for subtasks:', subtaskNumbers);

      const response = await fetch('/api/tasks/search-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subtaskNumbers })
      });

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data);
        console.log('[Vehicle Modal] Found matching tasks:', result.data);
      } else {
        console.error('[Vehicle Modal] Search failed:', result.error);
      }
    } catch (error) {
      console.error('[Vehicle Modal] Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProcessData = async () => {
    if (!data || !token || !selectedTaskId) {
      alert('Please select a task to process the data into.');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[Vehicle Modal] Processing data for task:', selectedTaskId);

      const response = await fetch('/api/tasks/process-vehicle-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleData: data,
          taskId: selectedTaskId
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Success! Processed ${result.data.processedSubtasks} subtasks.\n\nTask Progress: ${result.data.taskProgress.completedSubtasks}/${result.data.taskProgress.totalSubtasks} (${result.data.taskProgress.progress}%)`);
        
        // Refresh search results to show updated status
        await searchForMatchingTasks();
      } else {
        throw new Error(result.error || 'Failed to process data');
      }
    } catch (error) {
      console.error('[Vehicle Modal] Process error:', error);
      alert(`Failed to process data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDisk = (diskId: string) => {
    const newExpanded = new Set(expandedDisks);
    if (newExpanded.has(diskId)) {
      newExpanded.delete(diskId);
    } else {
      newExpanded.add(diskId);
    }
    setExpandedDisks(newExpanded);
  };

  const toggleSession = (sessionKey: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionKey)) {
      newExpanded.delete(sessionKey);
    } else {
      newExpanded.add(sessionKey);
    }
    setExpandedSessions(newExpanded);
  };

  const formatSessionName = (sessionName: string) => {
    // Convert "SBS1_Wstn_290525_060000_0000" to "SBS1 Wstn 29/05/25 06:00:00"
    const parts = sessionName.split('_');
    if (parts.length >= 4) {
      const date = parts[2];
      const time = parts[3];
      const formattedDate = date ? `${date.slice(0,2)}/${date.slice(2,4)}/${date.slice(4,6)}` : '';
      const formattedTime = time ? `${time.slice(0,2)}:${time.slice(2,4)}:${time.slice(4,6)}` : '';
      return `${parts[0]} ${parts[1]} ${formattedDate} ${formattedTime}`;
    }
    return sessionName;
  };

  const handleTaskSelection = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTaskSelection(false);
  };

  if (!isOpen || !data) return null;

  const stats = getVehicleDataStats(data);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold">Vehicle Data Detected</h2>
                <p className="text-blue-100 text-sm sm:text-base">
                  {stats.totalDisks} disks • {stats.totalSessions} sessions • {stats.totalSubtasks} subtasks
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalDisks}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Disks</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSessions}</div>
              <div className="text-xs sm:text-sm text-gray-600">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalSubtasks}</div>
              <div className="text-xs sm:text-sm text-gray-600">Subtasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalDrops + stats.totalCores}</div>
              <div className="text-xs sm:text-sm text-gray-600">Total Items</div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Matching Tasks Section */}
          {isSearching ? (
            <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3 text-blue-600">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm sm:text-base">Searching for matching tasks...</span>
              </div>
            </div>
          ) : searchResults && searchResults.matchingTasks.length > 0 ? (
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-green-50 flex-shrink-0">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <h3 className="text-base sm:text-lg font-semibold text-green-800">
                  Found Matches in {searchResults.matchingTasks.length} Task{searchResults.matchingTasks.length !== 1 ? 's' : ''}
                </h3>
              </div>
              
              <div className="space-y-3">
                {searchResults.matchingTasks.map((task) => (
                  <div key={task.taskId} className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{task.taskTitle}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full self-start">
                            {task.taskLocation}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {task.totalMatches} matching subtask{task.totalMatches !== 1 ? 's' : ''} found
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.matchingSubtasks.slice(0, 5).map((subtask) => (
                            <span key={subtask.subtaskId} className={`text-xs px-2 py-1 rounded-full ${
                              subtask.isExecuted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {subtask.jiraNumber}
                            </span>
                          ))}
                          {task.matchingSubtasks.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{task.matchingSubtasks.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleTaskSelection(task.taskId)}
                        className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                          selectedTaskId === task.taskId
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedTaskId === task.taskId ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults && searchResults.matchingTasks.length === 0 ? (
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-yellow-50 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                <h3 className="text-base sm:text-lg font-semibold text-yellow-800">No Matching Tasks Found</h3>
              </div>
              <p className="text-yellow-700 mt-2 text-sm sm:text-base">
                No existing tasks contain the subtasks from this vehicle data. You may need to create a new task or check if the subtasks exist in a different system.
              </p>
            </div>
          ) : null}

          {/* Main Content */}
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vehicle Disk Data</h3>
            
            <div className="space-y-4 pb-4">
              {data.disks.map((disk) => (
                <div key={disk.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Disk Header */}
                  <button
                    onClick={() => toggleDisk(disk.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center space-x-3">
                      {expandedDisks.has(disk.id) ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      )}
                      <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{disk.id}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{disk.sessions.length} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {disk.sessions.reduce((total, session) => {
                          const sessionData = Object.values(session)[0];
                          return total + sessionData.subtasks.length;
                        }, 0)} subtasks
                      </div>
                    </div>
                  </button>
                  
                  {/* Disk Content */}
                  {expandedDisks.has(disk.id) && (
                    <div className="p-3 sm:p-4 space-y-3">
                      {disk.sessions.map((sessionGroup, sessionIndex) => {
                        const [sessionName, sessionData] = Object.entries(sessionGroup)[0];
                        const sessionKey = `${disk.id}-${sessionIndex}`;
                        
                        return (
                          <div key={sessionKey} className="border border-gray-100 rounded-lg overflow-hidden">
                            {/* Session Header */}
                            <button
                              onClick={() => toggleSession(sessionKey)}
                              className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition-colors touch-manipulation"
                            >
                              <div className="flex items-center space-x-3">
                                {expandedSessions.has(sessionKey) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <div className="text-left">
                                  <h5 className="font-medium text-gray-900 text-xs sm:text-sm">
                                    {formatSessionName(sessionName)}
                                  </h5>
                                  <p className="text-xs text-gray-600">
                                    {sessionData.subtasks.length} subtasks • {sessionData.drops} drops • {sessionData.cores} cores
                                  </p>
                                </div>
                              </div>
                            </button>
                            
                            {/* Session Content */}
                            {expandedSessions.has(sessionKey) && (
                              <div className="p-3 bg-white">
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900">{sessionData.drops}</div>
                                    <div className="text-xs text-gray-600">Drops</div>
                                  </div>
                                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900">{sessionData.cores}</div>
                                    <div className="text-xs text-gray-600">Cores</div>
                                  </div>
                                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                                    <div className="text-base sm:text-lg font-semibold text-gray-900">{sessionData.subtasks.length}</div>
                                    <div className="text-xs text-gray-600">Subtasks</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h6 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Subtasks:</h6>
                                  <div className="flex flex-wrap gap-1 sm:gap-2">
                                    {sessionData.subtasks.map((subtask, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-mono"
                                      >
                                        {subtask}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              <strong>Total:</strong> {stats.totalDrops} drops • {stats.totalCores} cores • {stats.totalSubtasks} subtasks
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              {searchResults && searchResults.matchingTasks.length > 0 && (
                <button
                  onClick={handleProcessData}
                  disabled={!selectedTaskId || isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base touch-manipulation"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>{isProcessing ? 'Processing...' : 'Process Data'}</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base touch-manipulation"
              >
                Close
              </button>
            </div>
          </div>
          
          {!selectedTaskId && searchResults && searchResults.matchingTasks.length > 0 && (
            <div className="mt-3 text-xs sm:text-sm text-orange-600">
              Please select a task above to process the vehicle data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 