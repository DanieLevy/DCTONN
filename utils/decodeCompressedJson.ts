// Utility function to decode compressed JSON from base64 strings

/**
 * Detects if a string is base64 encoded
 */
export function isBase64(str: string): boolean {
  if (!str || str.length === 0 || str.length % 4 !== 0) {
    return false;
  }
  
  // Base64 regex pattern
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str);
}

/**
 * Detects if a string is a URL
 */
export function isURL(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fetches content from a URL using server-side proxy to avoid CORS issues
 */
async function fetchURLContent(url: string): Promise<string> {
  try {
    console.log('[URL Fetcher] Fetching content via proxy from:', url);
    
    // Use our server-side proxy API to avoid CORS issues
    const response = await fetch('/api/qr/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch URL content');
    }

    console.log('[URL Fetcher] Content fetched successfully via proxy. Length:', data.processedLength);
    return data.content;
    
  } catch (error) {
    console.error('[URL Fetcher] Failed to fetch URL content:', error);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the URL fetching service');
    } else if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'))) {
      throw new Error('Timeout: The URL took too long to respond');
    } else if (error instanceof Error && (error.message.includes('CORS') || error.message.includes('blocked'))) {
      throw new Error('Access blocked: The URL doesn\'t allow external access');
    } else {
      throw new Error(`Failed to fetch URL content: ${error instanceof Error ? error.message : error}`);
    }
  }
}

/**
 * Decodes base64 string to UTF-8 text
 */
function decodeBase64(base64String: string): string {
  try {
    // Use browser's built-in atob for base64 decoding
    return atob(base64String);
  } catch (error) {
    throw new Error(`Failed to decode base64: ${error}`);
  }
}

/**
 * Attempts to decompress data using various methods
 */
function decompressData(data: string): string {
  // If it's already valid JSON, return as is
  try {
    JSON.parse(data);
    return data;
  } catch {
    // Not JSON, try other decompression methods
  }

  // Try URL decoding (in case it's URL encoded)
  try {
    const urlDecoded = decodeURIComponent(data);
    JSON.parse(urlDecoded);
    return urlDecoded;
  } catch {
    // URL decoding didn't work
  }

  // Try to handle escaped JSON
  try {
    const unescaped = data.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    JSON.parse(unescaped);
    return unescaped;
  } catch {
    // Unescaping didn't work
  }

  // If we have pako (compression library), we could add gzip decompression here
  // For now, return the data as is
  return data;
}

/**
 * Main function to decode compressed JSON from various formats
 */
export async function decodeCompressedJson(input: string): Promise<any> {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  let decodedString = input.trim();

  // Step 1: Check if it's a URL and fetch content if necessary
  if (isURL(decodedString)) {
    console.log('[Decoder] URL detected, fetching content...');
    try {
      decodedString = await fetchURLContent(decodedString);
      console.log('[Decoder] URL content fetched successfully');
    } catch (error) {
      console.error('[Decoder] URL fetching failed:', error);
      throw new Error(`URL fetching failed: ${error}`);
    }
  }

  // Step 2: Check if it's base64 and decode if necessary
  if (isBase64(decodedString)) {
    console.log('[Decoder] Base64 detected, decoding...');
    try {
      decodedString = decodeBase64(decodedString);
      console.log('[Decoder] Base64 decoded successfully');
    } catch (error) {
      console.error('[Decoder] Base64 decoding failed:', error);
      throw new Error(`Base64 decoding failed: ${error}`);
    }
  }

  // Step 3: Attempt to decompress the data
  try {
    decodedString = decompressData(decodedString);
    console.log('[Decoder] Data decompression completed');
  } catch (error) {
    console.warn('[Decoder] Decompression failed, using raw data:', error);
  }

  // Step 4: Parse as JSON
  try {
    const parsed = JSON.parse(decodedString);
    console.log('[Decoder] JSON parsing successful');
    return parsed;
  } catch (error) {
    console.error('[Decoder] JSON parsing failed:', error);
    throw new Error(`Failed to parse JSON: ${error}. Raw data: ${decodedString.substring(0, 100)}...`);
  }
}

/**
 * Safe version that returns null on failure instead of throwing
 */
export async function safeDecodeCompressedJson(input: string): Promise<any | null> {
  try {
    return await decodeCompressedJson(input);
  } catch (error) {
    console.warn('[Decoder] Safe decode failed:', error);
    return null;
  }
} 