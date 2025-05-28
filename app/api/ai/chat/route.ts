import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadTasks } from '@/lib/data-store';

// LM Studio configuration from the specification
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

// Helper function to test LM Studio connection and get the best model
async function getLMStudioModel(): Promise<{ connected: boolean; model?: string; embeddingModel?: string; error?: string }> {
  try {
    console.log('[AI Chat] Testing LM Studio connection to:', LM_STUDIO_URL);
    
    const response = await fetch(`${LM_STUDIO_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    console.log('[AI Chat] LM Studio models endpoint response status:', response.status);
    
    if (response.ok) {
      const models = await response.json();
      console.log('[AI Chat] Available models:', models);
      
      const allModels = models.data || [];
      
      // Separate chat models and embedding models
      const chatModels = allModels.filter((model: any) => 
        !model.id.includes('embedding') && !model.id.includes('embed')
      );
      
      const embeddingModels = allModels.filter((model: any) => 
        model.id.includes('embedding') || model.id.includes('embed')
      );
      
      if (chatModels.length === 0) {
        return { connected: false, error: 'No suitable chat models found' };
      }

      // Primary model preferences - prioritize vision-capable model first
      let selectedModel = null;
      let selectedEmbeddingModel = null;

      // 1. Look for the preferred vision model first (qwen2-vl-2b-instruct)
      const visionModel = chatModels.find((model: any) => model.id === 'qwen2-vl-2b-instruct');
      if (visionModel) {
        selectedModel = visionModel.id;
        console.log('[AI Chat] Found preferred vision model:', selectedModel);
      } else {
        // 2. Fallback to other reliable models if vision model not available
        const fallbackPriority = [
          'llama-3.2-1b-instruct',      // Very lightweight and reliable
          'deepseek-r1-distill-qwen-7b', // Good reasoning capabilities
          'devstral-small-2505',         // Development focused
          'qwen2.5-coder-14b-instruct',  // Medium coding model
          'qwen2.5-coder-32b-instruct',  // Largest - try last due to resource issues
        ];

        for (const preferredModel of fallbackPriority) {
          const found = chatModels.find((model: any) => model.id === preferredModel);
          if (found) {
            selectedModel = found.id;
            console.log('[AI Chat] Using fallback model:', selectedModel);
            break;
          }
        }
        
        // If still no match, use first available
        if (!selectedModel && chatModels.length > 0) {
          selectedModel = chatModels[0].id;
          console.log('[AI Chat] Using first available model:', selectedModel);
        }
      }

      // 3. Look for the preferred embedding model
      const preferredEmbeddingModel = embeddingModels.find((model: any) => 
        model.id === 'text-embedding-mxbai-embed-large-v1'
      );
      
      if (preferredEmbeddingModel) {
        selectedEmbeddingModel = preferredEmbeddingModel.id;
        console.log('[AI Chat] Found preferred embedding model:', selectedEmbeddingModel);
      } else if (embeddingModels.length > 0) {
        // Fallback to other embedding models
        const embeddingFallbacks = [
          'text-embedding-nomic-embed-text-v1.5',
          'text-embedding-ada-002',
        ];
        
        for (const fallbackEmbed of embeddingFallbacks) {
          const found = embeddingModels.find((model: any) => model.id === fallbackEmbed);
          if (found) {
            selectedEmbeddingModel = found.id;
            console.log('[AI Chat] Using fallback embedding model:', selectedEmbeddingModel);
            break;
          }
        }
        
        // Use first available if no preferred found
        if (!selectedEmbeddingModel) {
          selectedEmbeddingModel = embeddingModels[0].id;
          console.log('[AI Chat] Using first available embedding model:', selectedEmbeddingModel);
        }
      }
      
      console.log('[AI Chat] Selected chat model:', selectedModel);
      console.log('[AI Chat] Selected embedding model:', selectedEmbeddingModel);
      
      return { 
        connected: true, 
        model: selectedModel,
        embeddingModel: selectedEmbeddingModel
      };
    } else {
      const errorText = await response.text();
      console.log('[AI Chat] LM Studio models endpoint failed:', response.statusText, errorText);
      return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error: any) {
    console.log('[AI Chat] LM Studio connection test failed:', error.message);
    return { connected: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Chat] === New chat request ===');
    
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      console.log('[AI Chat] Unauthorized request - invalid token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, context } = await request.json();
    console.log('[AI Chat] User message:', message);

    if (!message) {
      console.log('[AI Chat] No message provided');
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Load tasks for context
    console.log('[AI Chat] Loading tasks for context...');
    const tasks = await loadTasks();
    console.log('[AI Chat] Loaded', tasks.length, 'tasks');
    
    // Create context for AI
    const taskContext = tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: task.type,
      location: task.location,
      priority: task.priority,
      targetCar: task.targetCar,
      status: task.status,
      weather: task.weather,
      roadType: task.roadType,
      project: task.project,
      executionLocation: task.executionLocation,
    }));

    const systemPrompt = `You are an AI assistant for a task management system for autonomous vehicle testing. 
    You have access to the following tasks:
    ${JSON.stringify(taskContext, null, 2)}
    
    Help users find relevant tasks, answer questions about task requirements, and provide helpful information.
    Be concise and practical in your responses. Focus on helping users find tasks they can execute based on their queries.
    When asked about specific vehicles, locations, priorities, or conditions, filter the tasks accordingly and provide specific recommendations.`;

    // Test LM Studio connection and get the best model
    console.log('[AI Chat] Getting LM Studio model...');
    const { connected, model, embeddingModel, error } = await getLMStudioModel();
    
    if (connected && model) {
      console.log('[AI Chat] LM Studio is available, sending request with model:', model);
      
      try {
        const requestBody = {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        };
        
        console.log('[AI Chat] Sending request to LM Studio with model:', model);
        
        const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(45000), // 45 second timeout for chat completions
        });

        console.log('[AI Chat] LM Studio response status:', response.status);

        if (response.ok) {
          const aiResponse = await response.json();
          console.log('[AI Chat] LM Studio response successful');
          
          const aiMessage = aiResponse.choices?.[0]?.message?.content || 'Sorry, I could not process your request.';
          
          console.log('[AI Chat] Extracted AI message length:', aiMessage.length);
          
          return NextResponse.json({
            success: true,
            data: { 
              message: aiMessage,
              source: 'LM Studio',
              model: model,
              embeddingModel: embeddingModel,
              responseTime: aiResponse.usage ? `${aiResponse.usage.total_tokens} tokens` : undefined
            },
          });
        } else {
          const errorText = await response.text();
          console.log('[AI Chat] LM Studio error response:', errorText);
          throw new Error(`LM Studio request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.log('[AI Chat] LM Studio request failed:', error.message);
        console.log('[AI Chat] Error details:', error);
        // Fall through to fallback
      }
    } else {
      console.log('[AI Chat] LM Studio not available:', error || 'Unknown error');
    }

    // Fallback response if LM Studio is not available
    console.log('[AI Chat] Generating fallback response...');
    const fallbackResponse = generateFallbackResponse(message, tasks);
    
    console.log('[AI Chat] Fallback response generated');
    
    return NextResponse.json({
      success: true,
      data: { 
        message: fallbackResponse,
        source: 'Fallback AI',
        note: connected ? 'LM Studio request failed, using fallback' : `LM Studio not connected (${error}), using fallback`
      },
    });

  } catch (error: any) {
    console.error('[AI Chat] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(message: string, tasks: any[]): string {
  console.log('[AI Chat] Generating fallback for message:', message);
  
  const messageLower = message.toLowerCase();
  
  // Simple keyword matching for common queries
  if (messageLower.includes('car8') || messageLower.includes('car 8')) {
    const car8Tasks = tasks.filter(task => task.targetCar.toLowerCase().includes('car8'));
    console.log('[AI Chat] Found', car8Tasks.length, 'Car8 tasks');
    if (car8Tasks.length > 0) {
      const taskDetails = car8Tasks.map(t => `"${t.title}" (${t.location}, ${t.priority} priority, ${t.status})`).join(', ');
      return `I found ${car8Tasks.length} task(s) for Car8: ${taskDetails}`;
    }
    return 'No tasks found for Car8 vehicle.';
  }
  
  if (messageLower.includes('high priority') || messageLower.includes('important')) {
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    console.log('[AI Chat] Found', highPriorityTasks.length, 'high priority tasks');
    if (highPriorityTasks.length > 0) {
      const taskDetails = highPriorityTasks.map(t => `"${t.title}" (${t.location}, ${t.targetCar})`).join(', ');
      return `High priority tasks: ${taskDetails}`;
    }
    return 'No high priority tasks found.';
  }
  
  if (messageLower.includes('rain') || messageLower.includes('weather')) {
    const rainyTasks = tasks.filter(task => task.weather.toLowerCase().includes('rain'));
    console.log('[AI Chat] Found', rainyTasks.length, 'rainy weather tasks');
    if (rainyTasks.length > 0) {
      const taskDetails = rainyTasks.map(t => `"${t.title}" (${t.location})`).join(', ');
      return `Tasks with rainy weather conditions: ${taskDetails}`;
    }
    return 'No tasks found with rainy weather conditions.';
  }
  
  if (messageLower.includes('active') || messageLower.includes('available')) {
    const activeTasks = tasks.filter(task => task.status === 'active');
    console.log('[AI Chat] Found', activeTasks.length, 'active tasks');
    const taskDetails = activeTasks.slice(0, 3).map(t => `"${t.title}" (${t.location}, ${t.targetCar})`).join(', ');
    return `There are ${activeTasks.length} active tasks available: ${taskDetails}${activeTasks.length > 3 ? '...' : ''}`;
  }
  
  if (messageLower.includes('eu') || messageLower.includes('europe')) {
    const euTasks = tasks.filter(task => task.location === 'EU');
    console.log('[AI Chat] Found', euTasks.length, 'EU tasks');
    if (euTasks.length > 0) {
      const taskDetails = euTasks.map(t => `"${t.title}" (${t.targetCar}, ${t.priority} priority)`).join(', ');
      return `Found ${euTasks.length} tasks in EU: ${taskDetails}`;
    }
    return 'No tasks found in EU location.';
  }
  
  if (messageLower.includes('usa') || messageLower.includes('america')) {
    const usaTasks = tasks.filter(task => task.location === 'USA');
    console.log('[AI Chat] Found', usaTasks.length, 'USA tasks');
    if (usaTasks.length > 0) {
      const taskDetails = usaTasks.map(t => `"${t.title}" (${t.targetCar}, ${t.priority} priority)`).join(', ');
      return `Found ${usaTasks.length} tasks in USA: ${taskDetails}`;
    }
    return 'No tasks found in USA location.';
  }
  
  if (messageLower.includes('il') || messageLower.includes('israel')) {
    const ilTasks = tasks.filter(task => task.location === 'IL');
    console.log('[AI Chat] Found', ilTasks.length, 'IL tasks');
    if (ilTasks.length > 0) {
      const taskDetails = ilTasks.map(t => `"${t.title}" (${t.targetCar}, ${t.priority} priority)`).join(', ');
      return `Found ${ilTasks.length} tasks in IL: ${taskDetails}`;
    }
    return 'No tasks found in IL location.';
  }
  
  console.log('[AI Chat] No specific matches, returning general response');
  return `I found ${tasks.length} total tasks in the system. You can ask me about:
• Tasks for specific vehicles (e.g., "Car8 tasks")
• Tasks by location (EU, USA, IL)
• Tasks by priority (high, medium, low)
• Tasks by weather conditions
• Active or available tasks

How can I help you find the right task?`;
} 