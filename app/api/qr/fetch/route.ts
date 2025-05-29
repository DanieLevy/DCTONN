import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    let validatedUrl: URL;
    try {
      validatedUrl = new URL(url);
      if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('[QR Fetch API] Fetching URL:', url);

    // Fetch the URL content with proper headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; QRScanner/1.0)',
        'Accept': 'text/plain, text/html, application/json, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      // Set a reasonable timeout
      signal: AbortSignal.timeout(10000), // 10 seconds
    });

    if (!response.ok) {
      console.error('[QR Fetch API] HTTP error:', response.status, response.statusText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    const content = await response.text();
    
    console.log('[QR Fetch API] Content fetched successfully. Length:', content.length, 'Type:', contentType);
    
    // If it's HTML, try to extract useful content
    let processedContent = content;
    if (contentType.includes('text/html') || content.trim().startsWith('<')) {
      console.log('[QR Fetch API] HTML content detected, processing...');
      
      // Look for common patterns in HTML that might contain our data
      const patterns = [
        // Look for base64 content in script tags (replace [\s\S] for .* with s flag)
        /<script[^>]*>([\s\S]*?)<\/script>/g,
        // Look for data in meta tags
        /<meta[^>]*content=["']([^"']+)["'][^>]*>/gi,
        // Look for data attributes
        /data-[^=]*=["']([^"']+)["']/gi,
        // Look for pre-formatted text (replace [\s\S] for .* with s flag)
        /<pre[^>]*>([\s\S]*?)<\/pre>/g,
        // Look for code blocks (replace [\s\S] for .* with s flag)
        /<code[^>]*>([\s\S]*?)<\/code>/g,
      ];

      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            // Extract content and check if it looks like base64 or JSON
            const extracted = match.replace(/<[^>]*>/g, '').trim();
            if (extracted.length > 50 && (isBase64Like(extracted) || isJSONLike(extracted))) {
              processedContent = extracted;
              console.log('[QR Fetch API] Extracted meaningful content from HTML');
              break;
            }
          }
        }
        if (processedContent !== content) break;
      }

      // If no patterns matched, try to get the body text content
      if (processedContent === content) {
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (bodyMatch) {
          const bodyContent = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (bodyContent && bodyContent.length > 10) {
            processedContent = bodyContent;
            console.log('[QR Fetch API] Extracted body text content');
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      content: processedContent,
      contentType,
      originalLength: content.length,
      processedLength: processedContent.length,
    });

  } catch (error: any) {
    console.error('[QR Fetch API] Error:', error);
    
    // Handle specific error types
    let errorMessage = 'Failed to fetch URL content';
    if (error.name === 'TimeoutError') {
      errorMessage = 'Request timed out - URL took too long to respond';
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error - unable to reach the URL';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function isBase64Like(str: string): boolean {
  if (!str || str.length < 4 || str.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

function isJSONLike(str: string): boolean {
  const trimmed = str.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
} 