import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { loadTasks } from '@/lib/data-store';

// Extend the timeout for this route to 5 minutes for complex image analysis
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

// LM Studio configuration
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

// Helper function to get vision model
async function getVisionModel(): Promise<{ connected: boolean; model?: string; error?: string }> {
  try {
    console.log('[AI Image] Testing LM Studio connection to:', LM_STUDIO_URL);
    
    const response = await fetch(`${LM_STUDIO_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const models = await response.json();
      const allModels = models.data || [];
      
      // Look specifically for vision-capable models
      const visionModel = allModels.find((model: any) => model.id === 'qwen2-vl-2b-instruct');
      
      if (visionModel) {
        console.log('[AI Image] Found vision model:', visionModel.id);
        return { connected: true, model: visionModel.id };
      } else {
        // Fallback to other vision-capable models if available
        const visionCapableModels = allModels.filter((model: any) => 
          model.id.includes('vision') || 
          model.id.includes('vl') || 
          model.id.includes('multimodal')
        );
        
        if (visionCapableModels.length > 0) {
          console.log('[AI Image] Using fallback vision model:', visionCapableModels[0].id);
          return { connected: true, model: visionCapableModels[0].id };
        }
        
        return { connected: false, error: 'No vision-capable models found' };
      }
    } else {
      const errorText = await response.text();
      return { connected: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Image] === New image analysis request ===');
    
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      console.log('[AI Image] Unauthorized request - invalid token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string || 'Analyze this image and describe what you see. Relate it to autonomous vehicle testing if relevant.';

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      );
    }

    console.log('[AI Image] Processing image:', image.name, 'Size:', image.size);

    // Load tasks for context
    const tasks = await loadTasks();
    
    // Create context for AI
    const taskContext = tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: task.type,
      location: task.location,
      weather: task.weather,
      roadType: task.roadType,
      illumination: task.illumination,
      executionLocation: task.executionLocation,
    }));

    const systemPrompt = `You are an AI assistant specialized in autonomous vehicle testing and computer vision analysis. 
    Analyze images in the context of autonomous vehicle testing scenarios.
    
    Available tasks for reference:
    ${JSON.stringify(taskContext, null, 2)}
    
    When analyzing images:
    1. Describe what you see in detail
    2. Identify relevant conditions (weather, lighting, road type, traffic)
    3. Suggest which tasks from the available list might be relevant
    4. Point out any safety considerations or testing opportunities
    5. Be specific about technical details that matter for AV testing
    
    Provide practical, actionable insights for autonomous vehicle testing teams.`;

    // Test vision model availability
    const { connected, model, error } = await getVisionModel();
    
    if (connected && model) {
      console.log('[AI Image] Vision model available:', model);
      
      try {
        // Convert image to base64
        const imageBuffer = await image.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = image.type || 'image/jpeg';
        
        const requestBody = {
          model: model,
          messages: [
            { 
              role: 'system', 
              content: systemPrompt 
            },
            { 
              role: 'user', 
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        };
        
        console.log('[AI Image] Sending vision request to LM Studio');
        
        const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(120000), // Increased to 120 seconds (2 minutes) for complex image analysis
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const analysisResult = aiResponse.choices?.[0]?.message?.content || 'Could not analyze the image.';
          
          console.log('[AI Image] Vision analysis successful');
          
          return NextResponse.json({
            success: true,
            data: { 
              analysis: analysisResult,
              source: 'LM Studio Vision',
              model: model,
              imageSize: image.size,
              imageType: image.type
            },
          });
        } else {
          const errorText = await response.text();
          console.log('[AI Image] Vision request failed:', errorText);
          throw new Error(`Vision analysis failed: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.log('[AI Image] Vision request error:', error.message);
        // Fall through to fallback
      }
    } else {
      console.log('[AI Image] Vision model not available:', error);
    }

    // Fallback response when vision model is not available
    console.log('[AI Image] Generating fallback response...');
    const fallbackAnalysis = `Image analysis temporarily unavailable. Vision model not loaded.
    
However, I can help you with:
• Task recommendations based on conditions you describe
• Guidance on what to look for in autonomous vehicle testing scenarios
• Analysis of testing requirements for different environments

Please describe what you see in the image, and I can provide relevant task suggestions and testing guidance.

Available task types: ${tasks.map(t => t.type).join(', ')}
Available locations: ${[...new Set(tasks.map(t => t.location))].join(', ')}`;

    return NextResponse.json({
      success: true,
      data: { 
        analysis: fallbackAnalysis,
        source: 'Fallback (Vision Model Unavailable)',
        note: connected ? 'Vision model request failed, using fallback' : `Vision model not connected (${error}), using fallback`
      },
    });

  } catch (error: any) {
    console.error('[AI Image] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 