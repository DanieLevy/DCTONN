import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://192.168.5.9:1234';

export async function GET(request: NextRequest) {
  try {
    console.log('[AI Status] Checking AI system status');
    
    const token = getTokenFromRequest(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = {
      lmStudio: {
        url: LM_STUDIO_URL,
        connected: false,
        models: [],
        selectedModel: null as string | null,
        selectedEmbeddingModel: null as string | null,
        error: null as string | null,
        responseTime: 0,
        modelCount: 0,
        chatModelsCount: 0,
        embeddingModelsCount: 0
      },
      fallback: {
        available: true,
        description: 'Built-in keyword matching system with intelligent task filtering'
      }
    };

    // Test LM Studio connection
    const startTime = Date.now();
    try {
      console.log('[AI Status] Testing LM Studio connection to:', LM_STUDIO_URL);
      
      const response = await fetch(`${LM_STUDIO_URL}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });

      status.lmStudio.responseTime = Date.now() - startTime;

      if (response.ok) {
        const modelsData = await response.json();
        const allModels = modelsData.data || [];
        
        // Separate chat models and embedding models
        const chatModels = allModels.filter((model: any) => 
          !model.id.includes('embedding') && !model.id.includes('embed')
        );
        
        const embeddingModels = allModels.filter((model: any) => 
          model.id.includes('embedding') || model.id.includes('embed')
        );
        
        // Primary model preferences - prioritize vision-capable model first
        let selectedModel = null;
        let selectedEmbeddingModel = null;

        // 1. Look for the preferred vision model first (qwen2-vl-2b-instruct)
        const visionModel = chatModels.find((model: any) => model.id === 'qwen2-vl-2b-instruct');
        if (visionModel) {
          selectedModel = visionModel.id;
          console.log('[AI Status] Found preferred vision model:', selectedModel);
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
              console.log('[AI Status] Using fallback model:', selectedModel);
              break;
            }
          }
          
          // If still no match, use first available
          if (!selectedModel && chatModels.length > 0) {
            selectedModel = chatModels[0].id;
            console.log('[AI Status] Using first available model:', selectedModel);
          }
        }

        // 3. Look for the preferred embedding model
        const preferredEmbeddingModel = embeddingModels.find((model: any) => 
          model.id === 'text-embedding-mxbai-embed-large-v1'
        );
        
        if (preferredEmbeddingModel) {
          selectedEmbeddingModel = preferredEmbeddingModel.id;
          console.log('[AI Status] Found preferred embedding model:', selectedEmbeddingModel);
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
              console.log('[AI Status] Using fallback embedding model:', selectedEmbeddingModel);
              break;
            }
          }
          
          // Use first available if no preferred found
          if (!selectedEmbeddingModel && embeddingModels.length > 0) {
            selectedEmbeddingModel = embeddingModels[0].id;
            console.log('[AI Status] Using first available embedding model:', selectedEmbeddingModel);
          }
        }
        
        status.lmStudio.connected = true;
        status.lmStudio.models = allModels;
        status.lmStudio.selectedModel = selectedModel;
        status.lmStudio.selectedEmbeddingModel = selectedEmbeddingModel;
        status.lmStudio.modelCount = allModels.length;
        status.lmStudio.chatModelsCount = chatModels.length;
        status.lmStudio.embeddingModelsCount = embeddingModels.length;
        
        console.log('[AI Status] LM Studio connected successfully');
        console.log('[AI Status] Selected chat model:', selectedModel);
        console.log('[AI Status] Selected embedding model:', selectedEmbeddingModel);
        console.log('[AI Status] Chat models available:', chatModels.length);
        console.log('[AI Status] Embedding models available:', embeddingModels.length);
      } else {
        status.lmStudio.error = `HTTP ${response.status}: ${response.statusText}`;
        console.log('[AI Status] LM Studio connection failed:', status.lmStudio.error);
      }
    } catch (error: any) {
      status.lmStudio.responseTime = Date.now() - startTime;
      status.lmStudio.error = error.message;
      console.log('[AI Status] LM Studio connection error:', error.message);
    }

    return NextResponse.json({
      success: true,
      data: status,
    });

  } catch (error: any) {
    console.error('[AI Status] Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 