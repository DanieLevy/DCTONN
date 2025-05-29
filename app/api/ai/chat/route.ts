import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadComprehensiveAIData, ComprehensiveAIData } from '@/lib/data-store';

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

    // Load comprehensive AI data
    console.log('[AI Chat] Loading comprehensive AI data...');
    const aiData = await loadComprehensiveAIData();
    console.log('[AI Chat] Loaded comprehensive data:', {
      dcTasks: aiData.dcTasks.length,
      ttTasks: aiData.ttTasks.length,
      subtasks: aiData.allSubtasks.length,
      users: aiData.users.length
    });
    
    // Create enhanced context for AI with TT task details
    const systemPrompt = `You are an advanced AI assistant for autonomous vehicle testing task management. You have access to comprehensive data including:

SYSTEM OVERVIEW:
- ${aiData.statistics.totalDCTasks} Data Collection (DC) tasks
- ${aiData.statistics.totalTTTasks} Test Track (TT) tasks containing ${aiData.statistics.totalSubtasks} subtasks
- Completion rate: ${aiData.statistics.completionRate.toFixed(1)}%
- Active subtasks: ${aiData.statistics.activeSubtasks}
- Pending subtasks: ${aiData.statistics.pendingSubtasks}

TT TASK CATEGORIES:
${Object.entries(aiData.statistics.categoryBreakdown).map(([cat, count]) => `- ${cat}: ${count} subtasks`).join('\n')}

SCENARIOS:
${Object.entries(aiData.statistics.scenarioBreakdown).map(([scenario, count]) => `- ${scenario}: ${count} subtasks`).join('\n')}

LIGHTING CONDITIONS:
${Object.entries(aiData.statistics.lightingBreakdown).map(([lighting, count]) => `- ${lighting}: ${count} subtasks`).join('\n')}

AGENT RULES:
${aiData.agentRules}

DC TASKS SAMPLE:
${JSON.stringify(aiData.dcTasks.slice(0, 3), null, 2)}

TT TASKS SAMPLE:
${JSON.stringify(aiData.ttTasks.slice(0, 2), null, 2)}

RECENT SUBTASKS SAMPLE:
${JSON.stringify(aiData.allSubtasks.slice(0, 5), null, 2)}

You are an expert in:
- ENCAP 2026 regulations and testing procedures
- VRU (Vulnerable Road Users) scenarios
- Test track execution planning
- Calendar optimization for test scheduling
- Performance analysis and bottleneck identification

Provide detailed, actionable responses based on this comprehensive dataset. When discussing TT tasks, include specific details about scenarios, lighting conditions, speeds, and execution parameters. Always consider the full context of assigned dates, priorities, and execution status.`;

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
          max_tokens: 800,
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
              responseTime: aiResponse.usage ? `${aiResponse.usage.total_tokens} tokens` : undefined,
              dataStats: aiData.statistics
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
    const fallbackResponse = generateEnhancedFallbackResponse(message, aiData);
    
    console.log('[AI Chat] Enhanced fallback response generated');
    
    return NextResponse.json({
      success: true,
      data: { 
        message: fallbackResponse,
        source: 'Enhanced Fallback AI',
        note: connected ? 'LM Studio request failed, using enhanced fallback' : `LM Studio not connected (${error}), using enhanced fallback`,
        dataStats: aiData.statistics
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

function generateEnhancedFallbackResponse(message: string, aiData: ComprehensiveAIData): string {
  console.log('[AI Chat] Generating enhanced fallback for message:', message);
  
  const messageLower = message.toLowerCase();
  
  // Enhanced vehicle-based queries
  if (messageLower.includes('car8') || messageLower.includes('car 8')) {
    const car8Tasks = aiData.dcTasks.filter((task: any) => task.targetCar && task.targetCar.toLowerCase().includes('car8'));
    console.log('[AI Chat] Found', car8Tasks.length, 'Car8 tasks');
    if (car8Tasks.length > 0) {
      const activeTasks = car8Tasks.filter((t: any) => t.status === 'active');
      const highPriorityTasks = car8Tasks.filter((t: any) => t.priority === 'high');
      
      let response = `🚗 **Car8 Task Analysis**\n\n`;
      response += `Found ${car8Tasks.length} task(s) for Car8:\n`;
      
      if (activeTasks.length > 0) {
        response += `\n**Active Tasks (${activeTasks.length}):**\n`;
        activeTasks.slice(0, 3).forEach((t: any) => {
          response += `• "${t.title}" (${t.location}, ${t.priority} priority)\n`;
        });
      }
      
      if (highPriorityTasks.length > 0) {
        response += `\n⚠️ **High Priority:** ${highPriorityTasks.length} urgent task(s) require immediate attention\n`;
      }
      
      // Weather recommendations
      const weatherTasks = car8Tasks.filter((t: any) => t.weather && t.weather !== 'clear');
      if (weatherTasks.length > 0) {
        response += `\n🌦️ **Weather-Sensitive:** ${weatherTasks.length} task(s) depend on specific weather conditions\n`;
      }
      
      return response;
    }
    return '🚗 No tasks currently assigned to Car8 vehicle. Consider checking other vehicles or contact your task coordinator.';
  }
  
  // Smart priority analysis
  if (messageLower.includes('high priority') || messageLower.includes('urgent') || messageLower.includes('important')) {
    const highPriorityTasks = aiData.dcTasks.filter((task: any) => task.priority === 'high');
    console.log('[AI Chat] Found', highPriorityTasks.length, 'high priority tasks');
    
    if (highPriorityTasks.length > 0) {
      const byLocation = highPriorityTasks.reduce((acc: Record<string, number>, t: any) => {
        acc[t.location] = (acc[t.location] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let response = `🔥 **High Priority Task Analysis**\n\n`;
      response += `Found ${highPriorityTasks.length} high priority task(s):\n\n`;
      
      // Group by location
      Object.entries(byLocation).forEach(([location, count]) => {
        response += `**${location}:** ${count} task(s)\n`;
        const locationTasks = highPriorityTasks.filter((t: any) => t.location === location).slice(0, 2);
        locationTasks.forEach((t: any) => {
          response += `  • "${t.title}" (${t.targetCar || 'TBA'})\n`;
        });
      });
      
      response += `\n💡 **Recommendation:** Focus on these high-priority tasks first to maintain project timelines.`;
      return response;
    }
    return '✅ No high priority tasks currently pending. Great job staying on top of urgent items!';
  }
  
  // Weather-based recommendations
  if (messageLower.includes('weather') || messageLower.includes('rain') || messageLower.includes('clear') || messageLower.includes('conditions')) {
    const weatherTasks = aiData.dcTasks.filter((task: any) => task.weather && task.weather !== 'clear');
    const clearWeatherTasks = aiData.dcTasks.filter((task: any) => task.weather === 'clear' || !task.weather);
    
    let response = `🌤️ **Weather-Based Task Recommendations**\n\n`;
    
    if (weatherTasks.length > 0) {
      const weatherGroups = weatherTasks.reduce((acc: Record<string, number>, t: any) => {
        acc[t.weather] = (acc[t.weather] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      response += `**Weather-Dependent Tasks:** ${weatherTasks.length}\n`;
      Object.entries(weatherGroups).forEach(([weather, count]) => {
        response += `  • ${weather}: ${count} task(s)\n`;
      });
    }
    
    if (clearWeatherTasks.length > 0) {
      response += `\n**Clear Weather Tasks:** ${clearWeatherTasks.length} task(s) can be executed anytime\n`;
    }
    
    response += `\n💡 **Tip:** Plan weather-specific tasks around forecast conditions for optimal efficiency.`;
    return response;
  }
  
  // Location-based insights with smart recommendations
  const locationQueries = ['eu', 'europe', 'usa', 'america', 'il', 'israel'];
  const mentionedLocation = locationQueries.find(loc => messageLower.includes(loc));
  
  if (mentionedLocation) {
    const locationMap: Record<string, string> = { 
      'eu': 'EU', 'europe': 'EU', 'usa': 'USA', 'america': 'USA', 'il': 'IL', 'israel': 'IL' 
    };
    const targetLocation = locationMap[mentionedLocation];
    
    const locationTasks = aiData.dcTasks.filter((task: any) => task.location === targetLocation);
    console.log('[AI Chat] Found', locationTasks.length, `${targetLocation} tasks`);
    
    if (locationTasks.length > 0) {
      const priorityBreakdown = locationTasks.reduce((acc: Record<string, number>, t: any) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const vehicleBreakdown = locationTasks.reduce((acc: Record<string, number>, t: any) => {
        const vehicle = t.targetCar || 'Unassigned';
        acc[vehicle] = (acc[vehicle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      let response = `📍 **${targetLocation} Task Overview**\n\n`;
      response += `Total tasks: ${locationTasks.length}\n\n`;
      
      response += `**Priority Breakdown:**\n`;
      Object.entries(priorityBreakdown).forEach(([priority, count]) => {
        const emoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
        response += `  ${emoji} ${priority}: ${count}\n`;
      });
      
      response += `\n**Vehicle Assignment:**\n`;
      Object.entries(vehicleBreakdown).slice(0, 3).forEach(([vehicle, count]) => {
        response += `  🚗 ${vehicle}: ${count} task(s)\n`;
      });
      
      // Smart recommendations
      const highPriorityCount = priorityBreakdown['high'] || 0;
      if (highPriorityCount > 0) {
        response += `\n⚠️ **Alert:** ${highPriorityCount} high priority task(s) need immediate attention in ${targetLocation}`;
      }
      
      return response;
    }
    return `📍 No tasks currently available in ${targetLocation}. Check other locations or wait for new task assignments.`;
  }
  
  // Smart task status and progress insights
  if (messageLower.includes('progress') || messageLower.includes('status') || messageLower.includes('completion')) {
    const activeTasks = aiData.dcTasks.filter((task: any) => task.status === 'active');
    const completedTasks = aiData.dcTasks.filter((task: any) => task.status === 'completed');
    const totalTasks = aiData.dcTasks.length;
    
    if (totalTasks > 0) {
      const completionRate = (completedTasks.length / totalTasks) * 100;
      
      let response = `📊 **Task Progress Overview**\n\n`;
      response += `**Overall Status:**\n`;
      response += `  ✅ Completed: ${completedTasks.length} (${completionRate.toFixed(1)}%)\n`;
      response += `  🟡 Active: ${activeTasks.length}\n`;
      response += `  📈 Total: ${totalTasks}\n\n`;
      
      // Performance insights
      if (completionRate > 80) {
        response += `🎉 **Excellent!** You're making outstanding progress with ${completionRate.toFixed(1)}% completion rate.\n`;
      } else if (completionRate > 50) {
        response += `👍 **Good progress!** You're over halfway done. Keep up the momentum!\n`;
      } else if (completionRate > 20) {
        response += `💪 **Getting started!** You're making steady progress. Consider prioritizing high-impact tasks.\n`;
      } else {
        response += `🚀 **Time to accelerate!** Focus on completing a few key tasks to build momentum.\n`;
      }
      
      // Actionable recommendations
      const highPriorityActive = activeTasks.filter((t: any) => t.priority === 'high');
      if (highPriorityActive.length > 0) {
        response += `\n🎯 **Next Steps:** Focus on ${highPriorityActive.length} high priority active task(s) first.`;
      }
      
      return response;
    }
    return '📊 No task data available for progress analysis.';
  }
  
  // Smart vehicle utilization query
  if (messageLower.includes('vehicle') || messageLower.includes('car') || messageLower.includes('assignment')) {
    const vehicleGroups = aiData.dcTasks.reduce((acc: Record<string, { count: number; tasks: any[] }>, task: any) => {
      const vehicle = task.targetCar || 'Unassigned';
      if (!acc[vehicle]) acc[vehicle] = { count: 0, tasks: [] };
      acc[vehicle].count++;
      acc[vehicle].tasks.push(task);
      return acc;
    }, {} as Record<string, { count: number; tasks: any[] }>);
    
    let response = `🚗 **Vehicle Utilization Analysis**\n\n`;
    
    const sortedVehicles = Object.entries(vehicleGroups)
      .sort(([,a], [,b]) => (b as { count: number }).count - (a as { count: number }).count)
      .slice(0, 5);
    
    sortedVehicles.forEach(([vehicle, data]) => {
      const typedData = data as { count: number; tasks: any[] };
      const activeTasks = typedData.tasks.filter((t: any) => t.status === 'active');
      const highPriorityTasks = typedData.tasks.filter((t: any) => t.priority === 'high');
      
      response += `**${vehicle}:** ${typedData.count} task(s)`;
      if (activeTasks.length > 0) response += ` (${activeTasks.length} active)`;
      if (highPriorityTasks.length > 0) response += ` ⚠️ ${highPriorityTasks.length} high priority`;
      response += `\n`;
    });
    
    // Smart recommendations
    const mostUtilized = sortedVehicles[0];
    if (mostUtilized && (mostUtilized[1] as { count: number }).count > 3) {
      response += `\n💡 **Optimization Tip:** ${mostUtilized[0]} has the most tasks (${(mostUtilized[1] as { count: number }).count}). Consider batch execution for efficiency.`;
    }
    
    return response;
  }
  
  // Default smart response with actionable insights
  console.log('[AI Chat] No specific matches, returning enhanced general response');
  const activeTasks = aiData.dcTasks.filter((t: any) => t.status === 'active');
  const highPriorityTasks = aiData.dcTasks.filter((t: any) => t.priority === 'high');
  const locationCounts = aiData.dcTasks.reduce((acc: Record<string, number>, t: any) => {
    acc[t.location] = (acc[t.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let response = `🤖 **AI Task Assistant**\n\n`;
  response += `I found ${aiData.dcTasks.length} total tasks in the system:\n`;
  response += `  • ${activeTasks.length} active task(s)\n`;
  if (highPriorityTasks.length > 0) {
    response += `  • ${highPriorityTasks.length} high priority task(s) ⚠️\n`;
  }
  
  response += `\n📍 **Locations:** ${Object.keys(locationCounts).join(', ')}\n\n`;
  
  response += `**Try asking me:**\n`;
  response += `• "Which tasks can I do with Car8?"\n`;
  response += `• "Show me high priority tasks"\n`;
  response += `• "What's my progress status?"\n`;
  response += `• "Tasks with weather conditions"\n`;
  response += `• "EU tasks" or "USA tasks" or "IL tasks"\n\n`;
  
  response += `💡 **Tip:** Upload an image for AI analysis to match relevant tasks!`;
  
  return response;
} 