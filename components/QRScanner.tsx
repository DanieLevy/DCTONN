'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Scan, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

export function QRScanner({ isOpen, onClose, onScanResult }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [scanAnimation, setScanAnimation] = useState(false);

  // Detect iOS Safari
  const isIOSSafari = typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    /Safari/.test(navigator.userAgent);

  // Ensure client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isOpen && videoRef.current && isClient) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, isClient]);

  const startScanner = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setIsScanning(true);
      setHasPermission(null);

      // Check if we're in a secure context (HTTPS or localhost)
      const isSecureContext = typeof window !== 'undefined' && (
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
      );

      // Development mode warning for camera access
      if (typeof window !== 'undefined' && !isSecureContext) {
        console.warn('[QR Scanner] Camera access may be blocked in insecure context (HTTP)');
        
        // Check if we're accessing via IP address in development
        const isIPAddress = /^\d+\.\d+\.\d+\.\d+/.test(window.location.hostname);
        if (isIPAddress && process.env.NODE_ENV === 'development') {
          throw new Error(
            'Camera access requires HTTPS when accessing via IP address. ' +
            'To fix this in development:\n\n' +
            '1. Use "npm run dev:https" instead of "npm run dev"\n' +
            '2. Or access via localhost tunnel (ngrok, etc.)\n' +
            '3. Or test on localhost directly\n\n' +
            'Current URL: ' + window.location.href
          );
        }
      }

      if (!QrScanner.hasCamera()) {
        throw new Error('No camera found on this device');
      }

      const scannerOptions: any = {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        preferredCamera: 'environment',
        maxScansPerSecond: isIOSSafari ? 3 : 5,
      };

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('[QR Scanner] QR code detected:', result);
          setScanAnimation(true);
          setScanResult(result.data);
          onScanResult(result.data);
          
          // Vibrate on success
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          
          // Reset animation after a moment
          setTimeout(() => setScanAnimation(false), 1000);
        },
        scannerOptions
      );

      await qrScannerRef.current.start();
      setHasPermission(true);

    } catch (err: any) {
      console.error('[QR Scanner] Error starting scanner:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this browser.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is busy. Please close other camera apps and try again.');
      } else if (err.message && err.message.includes('HTTPS')) {
        // Enhanced development mode error with actionable solutions
        setError(err.message);
      } else {
        setError(err.message || 'Failed to access camera.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setHasPermission(null);
    setError(null);
    setScanResult(null);
    setScanAnimation(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleRetry = () => {
    setScanResult(null);
    setError(null);
    setScanAnimation(false);
    startScanner();
  };

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Modern Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">QR Scanner</h1>
              <p className="text-sm text-white/70">Position code within the frame</p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        style={{ 
          transform: isIOSSafari ? 'scaleX(-1)' : 'none'
        }}
      />

      {/* Modern Scan Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Darkened overlay */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Scan Area */}
        <div className="relative">
          {/* Main scan frame */}
          <div 
            className="relative bg-transparent border-2 border-white/30 rounded-3xl overflow-hidden"
            style={{ 
              width: '280px', 
              height: '280px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Animated scanning line */}
            {hasPermission && !error && !scanResult && (
              <div className="absolute inset-0 overflow-hidden rounded-3xl">
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
                  style={{
                    animation: 'scan 2s linear infinite',
                    top: '50%'
                  }}
                />
              </div>
            )}
            
            {/* Corner indicators */}
            <div className="absolute inset-0">
              {/* Top-left */}
              <div className="absolute top-4 left-4 w-6 h-6">
                <div className="absolute top-0 left-0 w-6 h-1 bg-white rounded-full" />
                <div className="absolute top-0 left-0 w-1 h-6 bg-white rounded-full" />
              </div>
              
              {/* Top-right */}
              <div className="absolute top-4 right-4 w-6 h-6">
                <div className="absolute top-0 right-0 w-6 h-1 bg-white rounded-full" />
                <div className="absolute top-0 right-0 w-1 h-6 bg-white rounded-full" />
              </div>
              
              {/* Bottom-left */}
              <div className="absolute bottom-4 left-4 w-6 h-6">
                <div className="absolute bottom-0 left-0 w-6 h-1 bg-white rounded-full" />
                <div className="absolute bottom-0 left-0 w-1 h-6 bg-white rounded-full" />
              </div>
              
              {/* Bottom-right */}
              <div className="absolute bottom-4 right-4 w-6 h-6">
                <div className="absolute bottom-0 right-0 w-6 h-1 bg-white rounded-full" />
                <div className="absolute bottom-0 right-0 w-1 h-6 bg-white rounded-full" />
              </div>
            </div>

            {/* Success animation overlay */}
            {scanAnimation && (
              <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Message */}
      {hasPermission && !error && !scanResult && !isScanning && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3">
            <p className="text-white text-center font-medium">
              Align QR code within the frame
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">Starting Camera</h3>
            <p className="text-white/70">Please wait a moment...</p>
            {isIOSSafari && (
              <p className="text-white/50 text-sm mt-3">Tap "Allow" when prompted</p>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-30 p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">Camera Error</h3>
            <div className="text-white/70 mb-8 leading-relaxed text-sm">
              {error.split('\n').map((line, index) => (
                <p key={index} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
                  {line}
                </p>
              ))}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={handleClose}
                className="w-full bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {scanResult && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-30 p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3">Scan Successful!</h3>
            
            <div className="bg-black/30 rounded-2xl p-4 mb-8">
              <p className="text-white/90 font-mono text-sm break-all leading-relaxed">
                {scanResult}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleClose}
                className="w-full bg-green-500 text-white py-4 rounded-2xl font-semibold hover:bg-green-600 transition-all duration-200"
              >
                Done
              </button>
              
              <button
                onClick={() => setScanResult(null)}
                className="w-full bg-white/10 backdrop-blur-md text-white py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for scan animation */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
} 