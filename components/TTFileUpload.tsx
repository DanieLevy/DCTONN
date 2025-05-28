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
    priority: 'medium' as 'high' | 'medium' | 'low'
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

  const handleCreateTask = async () => {
    if (!uploadResult?.success || !uploadResult.data || !user || !token) {
      return;
    }

    if (!taskData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsCreating(true);

    try {
      const taskCreationData: TaskCreationData = {
        title: taskData.title.trim(),
        description: taskData.description.trim() || undefined,
        location: taskData.location,
        priority: taskData.priority,
        subtasks: uploadResult.data,
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
      priority: 'medium'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Create Test Track Task
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* File Upload Section */}
          {!uploadResult?.success && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Upload CSV/XLSX File</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Upload a CSV or XLSX file containing your test track subtasks
                </p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="text-sm text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">Drop your file here</p>
                      <p className="text-sm text-gray-600">or click to browse</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
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
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Sample
                </Button>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-4">
              {uploadResult.success ? (
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">File processed successfully!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Found {uploadResult.totalRows} valid subtasks in "{uploadResult.fileName}"
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetUpload}
                    className="text-green-700 hover:text-green-800"
                  >
                    Upload Different File
                  </Button>
                </div>
              ) : (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900">Upload failed</h3>
                    <p className="text-sm text-red-700 mt-1">{uploadResult.error}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetUpload}
                    className="text-red-700 hover:text-red-800"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Task Details Form */}
          {uploadResult?.success && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium text-gray-900">Task Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={taskData.title}
                    onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
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

                <div className="space-y-2">
                  <Label>Subtasks</Label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                    {uploadResult.totalRows} subtasks loaded
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={taskData.description}
                  onChange={(e) => setTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            {uploadResult?.success && (
              <Button 
                onClick={handleCreateTask} 
                disabled={isCreating || !taskData.title.trim()}
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
        </CardContent>
      </Card>
    </div>
  );
} 