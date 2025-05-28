'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Loader2
} from 'lucide-react';
import { processUploadedFile, generateSampleCSV } from '@/lib/csv-processor';
import { FileUploadResult, TaskCreationData, TTSubtask } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

interface TTFileUploadProps {
  onTaskCreated: (taskId: string) => void;
  onClose: () => void;
}

export function TTFileUpload({ onTaskCreated, onClose }: TTFileUploadProps) {
  const { user, token } = useAuth();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    location: user?.location || 'IL',
    priority: 'medium' as 'high' | 'medium' | 'low',
    version: '1.0'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setUploadResult(null);

    try {
      console.log('[TT Upload] Processing file:', file.name);
      const result = await processUploadedFile(file);
      setUploadResult(result);
      
      if (result.success) {
        console.log('[TT Upload] Successfully processed', result.totalRows, 'subtasks');
        // Auto-fill title with filename if empty
        if (!taskData.title && result.fileName) {
          setTaskData(prev => ({
            ...prev,
            title: result.fileName!.replace(/\.(csv|xlsx|xls)$/i, '')
          }));
        }
      }
    } catch (error) {
      console.error('[TT Upload] Error processing file:', error);
      setUploadResult({
        success: false,
        error: 'Failed to process file. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to generate JIRA subtask numbers
  const generateJiraSubtaskNumbers = (subtasks: TTSubtask[], startingNumber: number = 10223): TTSubtask[] => {
    return subtasks.map((subtask, index) => ({
      ...subtask,
      jira_subtask_number: `DATACO-${(startingNumber + index).toString().padStart(5, '0')}`
    }));
  };

  const handleCreateTask = async () => {
    if (!uploadResult?.success || !uploadResult.data || !user || !token) {
      return;
    }

    if (!taskData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (!taskData.version.trim()) {
      alert('Please enter a version number');
      return;
    }

    setIsCreating(true);

    try {
      // Generate JIRA subtask numbers
      const subtasksWithJira = generateJiraSubtaskNumbers(uploadResult.data);

      const taskCreationData: TaskCreationData = {
        title: taskData.title.trim(),
        description: taskData.description.trim() || undefined,
        location: taskData.location,
        priority: taskData.priority,
        version: taskData.version.trim(),
        subtasks: subtasksWithJira,
        csvFileName: uploadResult.fileName || 'unknown.csv'
      };

      console.log('[TT Upload] Creating TT task with', taskCreationData.subtasks.length, 'subtasks');

      const response = await fetch('/api/tasks/tt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskCreationData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('[TT Upload] Task created successfully:', result.data.id);
        onTaskCreated(result.data.id);
      } else {
        throw new Error(result.error || 'Failed to create task');
      }

    } catch (error) {
      console.error('[TT Upload] Error creating task:', error);
      alert(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-tt-task.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setUploadResult(null);
    setTaskData({
      title: '',
      description: '',
      location: user?.location || 'IL',
      priority: 'medium',
      version: '1.0'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 flex-shrink-0">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            Create Test Track Task
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 overflow-y-auto flex-1 px-4 sm:px-6">
          {/* File Upload Section */}
          {!uploadResult?.success && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label className="text-sm font-medium">Upload CSV/XLSX File</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Upload a CSV or XLSX file containing your test track subtasks
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <div className="space-y-2">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-base sm:text-lg font-medium">Drop your file here</p>
                      <p className="text-sm text-gray-600">or click to browse</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Supported formats: CSV, XLSX, XLS
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={downloadSampleCSV}
                  className="text-blue-600 hover:text-blue-700 h-auto py-1 px-2"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Sample
                </Button>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-3 sm:space-y-4">
              {uploadResult.success ? (
                <div className="flex items-start space-x-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-green-900 text-sm sm:text-base">File processed successfully!</h3>
                    <p className="text-xs sm:text-sm text-green-700 mt-1 break-words">
                      Found {uploadResult.totalRows} valid subtasks in "{uploadResult.fileName}"
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetUpload}
                    className="text-green-700 hover:text-green-800 text-xs h-auto py-1 px-2 flex-shrink-0"
                  >
                    Upload Different File
                  </Button>
                </div>
              ) : (
                <div className="flex items-start space-x-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-red-900 text-sm sm:text-base">Upload failed</h3>
                    <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">{uploadResult.error}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetUpload}
                    className="text-red-700 hover:text-red-800 text-xs h-auto py-1 px-2 flex-shrink-0"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Task Details Form */}
          {uploadResult?.success && (
            <div className="space-y-3 sm:space-y-4 border-t pt-4 sm:pt-6">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Task Details</h3>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm">Task Title *</Label>
                  <Input
                    id="title"
                    value={taskData.title}
                    onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    required
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version" className="text-sm">Version *</Label>
                  <Input
                    id="version"
                    value={taskData.version}
                    onChange={(e) => setTaskData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 1.0, 2.1, etc."
                    required
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm">Priority</Label>
                  <select
                    id="priority"
                    value={taskData.priority}
                    onChange={(e) => setTaskData(prev => ({ 
                      ...prev, 
                      priority: e.target.value as 'high' | 'medium' | 'low' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm">Location</Label>
                  <select
                    id="location"
                    value={taskData.location}
                    onChange={(e) => setTaskData(prev => ({ ...prev, location: e.target.value as "EU" | "USA" | "IL" }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {user?.permissions?.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Subtasks</Label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm text-gray-700">
                  {uploadResult.totalRows} subtasks loaded with JIRA numbers (DATACO-10223 onwards)
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}
        </CardContent>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end space-x-3 pt-3 sm:pt-6 pb-3 sm:pb-6 px-4 sm:px-6 border-t bg-white flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isCreating} size="sm">
            Cancel
          </Button>
          {uploadResult?.success && (
            <Button 
              onClick={handleCreateTask} 
              disabled={isCreating || !taskData.title.trim()}
              size="sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Task...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
} 