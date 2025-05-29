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
 * Fetches content from a URL
 */
async function fetchURLContent(url: string): Promise<string> {
  try {
    console.log('[URL Fetcher] Fetching content from:', url);
    
    // For CORS issues, we might need to use a proxy or handle this on the server
    // For now, try direct fetch first
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, text/html, application/json, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; QRScanner/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    console.log('[URL Fetcher] Fetched content length:', content.length);
    
    // If the content looks like HTML, try to extract text content
    if (content.trim().startsWith('<') && content.includes('</')) {
      console.log('[URL Fetcher] HTML content detected, extracting text...');
      
      // Create a temporary DOM element to extract text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Try to get the main text content, excluding scripts and styles
      const scripts = tempDiv.querySelectorAll('script, style, noscript');
      scripts.forEach(script => script.remove());
      
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      console.log('[URL Fetcher] Extracted text content length:', textContent.length);
      
      // Look for base64-like content in the extracted text
      const lines = textContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      for (const line of lines) {
        if (isBase64(line) && line.length > 100) { // Reasonable base64 length
          console.log('[URL Fetcher] Found base64 content in HTML');
          return line;
        }
      }
      
      // If no base64 found, return the cleaned text
      return textContent.trim();
    }
    
    return content.trim();
  } catch (error) {
    console.error('[URL Fetcher] Failed to fetch URL content:', error);
    throw new Error(`Failed to fetch content from URL: ${error}`);
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