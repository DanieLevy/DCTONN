'use client';

import { useState } from 'react';
import { X, HardDrive, Play, FileText, Download, Upload } from 'lucide-react';
import { VehicleData, getVehicleDataStats } from '@/lib/vehicle-types';

interface VehicleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: VehicleData | null;
  rawQRContent?: string | null;
}

export function VehicleDataModal({ isOpen, onClose, data, rawQRContent }: VehicleDataModalProps) {
  const [selectedDisk, setSelectedDisk] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const stats = getVehicleDataStats(data);

  const formatSessionName = (sessionName: string) => {
    // Extract date and time from session name like "SBS1_Wstn_290525_060000_0000"
    const parts = sessionName.split('_');
    if (parts.length >= 4) {
      const datePart = parts[2]; // "290525"
      const timePart = parts[3]; // "060000"
      
      // Format date: 290525 -> 29/05/25
      const formattedDate = `${datePart.slice(0,2)}/${datePart.slice(2,4)}/${datePart.slice(4,6)}`;
      
      // Format time: 060000 -> 06:00:00
      const formattedTime = `${timePart.slice(0,2)}:${timePart.slice(2,4)}:${timePart.slice(4,6)}`;
      
      return `${parts[0]}_${parts[1]} • ${formattedDate} ${formattedTime}`;
    }
    return sessionName;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Vehicle Data Scanned</h2>
                <p className="text-blue-100 text-sm">
                  {data.disks.length} disk{data.disks.length !== 1 ? 's' : ''} • {stats.totalSessions} sessions • {stats.totalSubtasks} subtasks
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalSubtasks}</div>
              <div className="text-sm text-gray-600">Total Subtasks</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalDrops}</div>
              <div className="text-sm text-gray-600">Total Drops</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalCores}</div>
              <div className="text-sm text-gray-600">Total Cores</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <div className="space-y-6">
            {data.disks.map((disk, diskIndex) => (
              <div key={disk.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div 
                  className="bg-gray-100 p-4 cursor-pointer hover:bg-gray-150 transition-colors"
                  onClick={() => setSelectedDisk(selectedDisk === disk.id ? null : disk.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{disk.id}</h3>
                        <p className="text-sm text-gray-600">
                          {disk.sessions.length} session{disk.sessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {selectedDisk === disk.id ? '−' : '+'}
                    </div>
                  </div>
                </div>

                {selectedDisk === disk.id && (
                  <div className="p-4 bg-white">
                    <div className="space-y-4">
                      {disk.sessions.map((session, sessionIndex) => {
                        const sessionName = Object.keys(session)[0];
                        const sessionData = session[sessionName];
                        
                        return (
                          <div key={sessionIndex} className="border border-gray-100 rounded-lg overflow-hidden">
                            <div 
                              className="bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => setSelectedSession(selectedSession === sessionName ? null : sessionName)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Play className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">
                                      {formatSessionName(sessionName)}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                                      <span className="flex items-center space-x-1">
                                        <FileText className="w-3 h-3" />
                                        <span>{sessionData.subtasks.length} subtasks</span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <Download className="w-3 h-3" />
                                        <span>{sessionData.drops} drops</span>
                                      </span>
                                      <span className="flex items-center space-x-1">
                                        <Upload className="w-3 h-3" />
                                        <span>{sessionData.cores} cores</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-gray-400 text-sm">
                                  {selectedSession === sessionName ? '−' : '+'}
                                </div>
                              </div>
                            </div>

                            {selectedSession === sessionName && (
                              <div className="p-3 bg-white border-t border-gray-100">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Subtasks:</h5>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                  {sessionData.subtasks.map((subtask, subtaskIndex) => (
                                    <div 
                                      key={subtaskIndex}
                                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium text-center"
                                    >
                                      {subtask}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              QR Code scanned successfully
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Future: Process this data
                  console.log('Processing vehicle data:', data);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Process Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 