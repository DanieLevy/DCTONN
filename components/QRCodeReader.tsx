'use client';

import { useState } from 'react';
import { decodeCompressedJson, isBase64, isURL } from '../utils/decodeCompressedJson';
import { isValidVehicleData } from '@/lib/vehicle-types';
import { X, Copy, Check, AlertTriangle, FileText, Zap, Globe } from 'lucide-react';

interface QRCodeReaderProps {
  isOpen?: boolean;
  onClose?: () => void;
  onVehicleDataFound?: (data: any) => void;
}

export default function QRCodeReader({ isOpen, onClose, onVehicleDataFound }: QRCodeReaderProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<string>('');

  const handleDecode = async () => {
    if (!input.trim()) {
      setError('Please enter some data to decode');
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput(null);
    setProcessingMethod('');

    try {
      console.log('[QR Reader] Starting decode process...');
      
      let method = '';
      if (isURL(input.trim())) {
        method = 'URL Fetch + Decode';
      } else if (isBase64(input.trim())) {
        method = 'Base64 Decode';
      } else {
        method = 'Direct Parse';
      }
      
      setProcessingMethod(method);
      const result = await decodeCompressedJson(input.trim());
      setOutput(result);
      
      // Check if it's valid vehicle data
      if (isValidVehicleData(result)) {
        console.log('[QR Reader] Valid vehicle data detected!');
        if (onVehicleDataFound) {
          onVehicleDataFound(result);
        }
      }
      
      console.log('[QR Reader] Decode successful:', result);
    } catch (err: any) {
      console.error('[QR Reader] Decode failed:', err);
      setError(err.message || 'Failed to decode data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (output) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(output, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput(null);
    setError(null);
    setProcessingMethod('');
  };

  const detectInputType = (value: string) => {
    if (!value.trim()) return 'empty';
    if (isURL(value.trim())) return 'url';
    if (isBase64(value.trim())) return 'base64';
    try {
      JSON.parse(value.trim());
      return 'json';
    } catch {
      return 'text';
    }
  };

  const inputType = detectInputType(input);

  if (isOpen === false) return null;

  return (
    <div className={`${isOpen !== undefined ? 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4' : ''}`}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${isOpen !== undefined ? '' : 'border border-gray-200'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">QR Code Decoder</h2>
                <p className="text-purple-100 text-sm">
                  Test URLs, base64 and compressed JSON decoding
                </p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Input Data
              </label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${
                  inputType === 'url' ? 'bg-purple-100 text-purple-700' :
                  inputType === 'base64' ? 'bg-blue-100 text-blue-700' :
                  inputType === 'json' ? 'bg-green-100 text-green-700' :
                  inputType === 'text' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {inputType === 'url' && <Globe className="w-3 h-3" />}
                  <span>
                    {inputType === 'url' ? 'URL Detected' :
                     inputType === 'base64' ? 'Base64 Detected' :
                     inputType === 'json' ? 'JSON Detected' :
                     inputType === 'text' ? 'Text Data' : 'No Data'}
                  </span>
                </span>
                {input && (
                  <button
                    onClick={handleClear}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              placeholder="Paste QR redirect URL (e.g., https://qr.me-qr.com/...), Base64 string, JSON, or any encoded data here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm font-mono resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={6}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleDecode} 
              disabled={!input.trim() || isLoading}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Processing...' : 'Decode'}</span>
            </button>
            
            <div className="text-sm text-gray-600">
              Characters: {input.length}
            </div>
            
            {processingMethod && (
              <div className="text-sm text-purple-600 font-medium">
                Method: {processingMethod}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-medium text-red-800">Decode Error</h3>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              {processingMethod && (
                <p className="text-red-600 text-xs mt-1">Failed at: {processingMethod}</p>
              )}
            </div>
          )}

          {output && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Decoded Result</h3>
                <div className="flex items-center space-x-2">
                  {processingMethod && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {processingMethod}
                    </span>
                  )}
                  {isValidVehicleData(output) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ Valid Vehicle Data
                    </span>
                  )}
                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className="bg-gray-50 border border-gray-200 p-4 overflow-auto text-xs rounded-lg font-mono">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}

          {!output && !error && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Enter some data above and click "Decode" to see the results</p>
            </div>
          )}
        </div>

        {/* Footer - Usage Instructions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <strong>Usage:</strong> This tool can fetch content from URLs (like QR redirect services), decode base64 strings, URL-encoded data, escaped JSON, and compressed data. 
            It will automatically detect the format and apply the appropriate decoding method.
          </div>
        </div>
      </div>
    </div>
  );
} 