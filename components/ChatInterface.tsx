'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Send, Bot, User, X, AlertCircle, CheckCircle, Minimize2, ImageIcon, Paperclip, Maximize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
  error?: boolean;
  imageData?: string; // Base64 image data for preview
  imageName?: string; // Original filename
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you find tasks, analyze requirements, and answer questions about your task management system. Try asking me about tasks for specific vehicles, weather conditions, or priorities!',
      timestamp: new Date(),
      source: 'System'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Add clipboard paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste when chat is open and input is focused
      if (!isOpen || !inputRef.current) return;

      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));

      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          console.log('[Chat] Image pasted from clipboard:', file.name, file.size);
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    // Add event listener to document
    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !selectedImage) || isLoading) return;

    console.log('[Chat] Sending message:', inputMessage, 'with image:', selectedImage?.name);

    // Store image data for chat history
    let imageDataForMessage = null;
    let imageNameForMessage = null;
    
    if (selectedImage) {
      imageDataForMessage = imagePreview; // Already in base64 format
      imageNameForMessage = selectedImage.name;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: selectedImage ? 
        `${inputMessage || 'Analyze this image'}` : 
        inputMessage,
      timestamp: new Date(),
      imageData: imageDataForMessage,
      imageName: imageNameForMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputMessage || 'Analyze this image and relate it to autonomous vehicle testing';
    const imageToSend = selectedImage;
    
    setInputMessage('');
    clearImage();
    setIsLoading(true);

    try {
      console.log('[Chat] Making API request with token:', token ? 'present' : 'missing');
      
      let response;
      
      if (imageToSend) {
        // Send image analysis request with longer timeout (2 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes for image analysis
        
        try {
          const formData = new FormData();
          formData.append('image', imageToSend);
          formData.append('prompt', messageToSend);
          
          response = await fetch('/api/ai/analyze-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        // Send regular text chat request with standard timeout (45 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds for text chat
        
        try {
          response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              message: messageToSend,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      }

      console.log('[Chat] API response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Chat] API response data:', data);

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: imageToSend ? data.data.analysis : data.data.message,
          timestamp: new Date(),
          source: data.data.source || 'Unknown',
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Show additional info if using fallback
        if (data.data.note) {
          const noteMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `ℹ️ ${data.data.note}`,
            timestamp: new Date(),
            source: 'System',
          };
          setTimeout(() => {
            setMessages(prev => [...prev, noteMessage]);
          }, 500);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('[Chat] Error:', error);
      
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error.name === 'AbortError') {
        errorContent = imageToSend 
          ? 'Image analysis timed out (2 minutes). The vision model might be processing a complex image. Please try again with a smaller image or wait a moment.'
          : 'Chat request timed out (45 seconds). The AI model might be busy. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorContent = 'Network error: Unable to connect to the AI service. Please check your connection and try again.';
      } else {
        errorContent = `Error: ${error.message}. Please check the console for more details.`;
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        source: 'Error',
        error: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared! How can I help you with your tasks?',
        timestamp: new Date(),
        source: 'System'
      }
    ]);
  };

  if (!isOpen) return null;

  // Minimized state - show as bottom bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="mx-auto max-w-md bg-white/95 backdrop-blur-sm shadow-lg border border-gray-200">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">AI Assistant</span>
              {messages.length > 1 && (
                <span className="text-xs text-gray-500">
                  ({messages.length - 1} message{messages.length - 1 !== 1 ? 's' : ''})
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="Restore chat"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose} 
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full chat interface
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Card */}
      <Card className="relative w-full max-w-md md:max-w-2xl h-[600px] flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-white/50 backdrop-blur-sm rounded-t-lg">
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <span className="text-gray-900">AI Assistant</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Minimize to bottom"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearChat} 
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Clear chat"
            >
              Clear
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="h-8 w-8 p-0 hover:bg-gray-100"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-white/90 backdrop-blur-sm">
          {/* Messages Container with proper overflow handling */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 break-words ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-md'
                      : message.error
                      ? 'bg-red-50 text-red-900 border border-red-200 shadow-sm'
                      : 'bg-gray-100 text-gray-900 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' ? (
                      message.error ? (
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
                      ) : (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      )
                    ) : (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-white" />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Image preview in message */}
                      {message.imageData && (
                        <div className="mb-2">
                          <img 
                            src={message.imageData} 
                            alt={message.imageName || "Uploaded image"} 
                            className="max-w-full max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              // Optional: Add full-size image viewer
                              const link = document.createElement('a');
                              link.href = message.imageData!;
                              link.download = message.imageName || 'image.png';
                              link.click();
                            }}
                          />
                          <div className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            📎 {message.imageName}
                          </div>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                      <div className={`flex items-center justify-between text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.source && (
                          <span className="flex items-center space-x-1 flex-shrink-0">
                            {message.source === 'LM Studio' && <CheckCircle className="h-3 w-3 text-green-600" />}
                            <span className="font-medium">{message.source}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl p-3 max-w-[85%] shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="text-sm text-gray-600">AI is thinking...</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t bg-white/80 backdrop-blur-sm p-4 rounded-b-lg">
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative">
                <img 
                  src={imagePreview} 
                  alt="Upload preview" 
                  className="max-h-32 rounded-lg border border-gray-200"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedImage?.name} ({Math.round((selectedImage?.size || 0) / 1024)}KB)
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-3"
                title="Upload image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedImage ? "Describe what you want me to analyze..." : "Ask me about tasks, vehicles, or paste/upload an image..."}
                disabled={isLoading}
                className="flex-1 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <Button
                onClick={sendMessage}
                disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                size="sm"
                className="px-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Try: "Which tasks can I do with Car8?" or paste/upload an image for analysis
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 