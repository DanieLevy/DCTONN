'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Camera, CheckCircle, AlertCircle, Flashlight } from 'lucide-react';
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
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

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

      // Check if QrScanner is supported
      if (!QrScanner.hasCamera()) {
        throw new Error('No camera found on this device');
      }

      // iOS Safari specific configurations
      const scannerOptions: any = {
        returnDetailedScanResult: true,
        highlightScanRegion: false, // Disable for iOS Safari to prevent issues
        highlightCodeOutline: false, // Disable for iOS Safari
        preferredCamera: 'environment', // Use back camera if available
        maxScansPerSecond: isIOSSafari ? 3 : 5, // Slower rate for iOS for better performance
      };

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('[QR Scanner] QR code detected:', result);
          setScanResult(result.data);
          onScanResult(result.data);
          
          // Vibrate on success (if supported)
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        },
        scannerOptions
      );

      // Start scanning with iOS-specific handling
      if (isIOSSafari) {
        // For iOS Safari, we need to be more explicit about camera constraints
        await qrScannerRef.current.start();
        
        // Check if flash is available
        if (qrScannerRef.current.hasFlash && await qrScannerRef.current.hasFlash()) {
          setHasFlash(true);
        }
      } else {
        await qrScannerRef.current.start();
        
        // Check for flash support
        try {
          if (qrScannerRef.current.hasFlash && await qrScannerRef.current.hasFlash()) {
            setHasFlash(true);
          }
        } catch (flashError) {
          console.log('[QR Scanner] Flash not supported');
        }
      }

      setHasPermission(true);
      console.log('[QR Scanner] Scanner started successfully on', isIOSSafari ? 'iOS Safari' : 'desktop/other');

    } catch (err: any) {
      console.error('[QR Scanner] Error starting scanner:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in Safari settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported. Please use Safari on iOS or Chrome/Firefox on other devices.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is busy or not accessible. Please close other camera apps and try again.');
      } else {
        setError(err.message || 'Failed to access camera. Please check your browser settings.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleFlash = async () => {
    if (qrScannerRef.current && hasFlash) {
      try {
        if (isFlashOn) {
          await qrScannerRef.current.turnFlashOff();
          setIsFlashOn(false);
        } else {
          await qrScannerRef.current.turnFlashOn();
          setIsFlashOn(true);
        }
      } catch (err) {
        console.error('[QR Scanner] Flash toggle error:', err);
      }
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
    setHasFlash(false);
    setIsFlashOn(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleTryAgain = () => {
    setScanResult(null);
    setError(null);
    startScanner();
  };

  if (!isOpen || !isClient) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-lg h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Scan QR Code</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Flash toggle button for mobile */}
            {hasFlash && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFlash}
                className={`${isFlashOn ? 'bg-yellow-100 text-yellow-700' : 'text-gray-600'}`}
              >
                <Flashlight className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scanner Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Starting camera...</p>
                  {isIOSSafari && (
                    <p className="text-xs mt-1 opacity-75">Tap "Allow" when prompted</p>
                  )}
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ 
                transform: isIOSSafari ? 'scaleX(-1)' : 'none' // Mirror for iOS front camera
              }}
            />

            {/* Enhanced scan overlay for mobile */}
            {hasPermission && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scan frame - larger on mobile */}
                  <div className={`${isIOSSafari ? 'w-56 h-56' : 'w-64 h-64'} border-2 border-white opacity-60 rounded-lg relative`}>
                    {/* Enhanced corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg shadow-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg shadow-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg shadow-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg shadow-lg"></div>
                    
                    {/* Center targeting circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-orange-500 rounded-full animate-pulse bg-orange-500/20"></div>
                    </div>
                  </div>
                  <p className="text-white text-center mt-4 text-sm font-medium bg-black/50 px-3 py-1 rounded">
                    {isIOSSafari ? 'Hold steady and center QR code' : 'Position QR code within the frame'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status/Results Area */}
          <div className="p-4 sm:p-6 bg-white flex-shrink-0 max-h-48 overflow-y-auto">
            {error && (
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-red-900 text-sm sm:text-base">Camera Error</h3>
                  <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">{error}</p>
                  {isIOSSafari && (
                    <p className="text-xs text-red-600 mt-2">
                      iOS Tip: Go to Settings → Safari → Camera & allow camera access
                    </p>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleTryAgain}
                  className="text-red-700 hover:text-red-800 text-xs"
                >
                  Try Again
                </Button>
              </div>
            )}

            {scanResult && (
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-green-900 text-sm sm:text-base">QR Code Scanned!</h3>
                  <p className="text-xs sm:text-sm text-green-700 mt-1 break-all font-mono">{scanResult}</p>
                </div>
              </div>
            )}

            {hasPermission && !error && !scanResult && (
              <div className="text-center py-4">
                <div className="animate-pulse">
                  <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Scanning for QR codes...</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isIOSSafari 
                      ? 'Make sure QR code is well-lit and hold phone steady' 
                      : 'Make sure the QR code is well-lit and in focus'
                    }
                  </p>
                  {hasFlash && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Use the flash button if needed
                    </p>
                  )}
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center py-4">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Camera access is required to scan QR codes</p>
                {isIOSSafari && (
                  <p className="text-xs text-gray-500 mb-3">
                    On iOS: Settings → Safari → Camera → Allow
                  </p>
                )}
                <Button onClick={handleTryAgain} variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Grant Camera Access
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center space-x-3 p-4 sm:p-6 border-t bg-gray-50 flex-shrink-0">
            <div className="text-xs text-gray-500">
              {isIOSSafari ? 'iOS Safari' : 'Desktop Browser'}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose} size="sm">
                Close
              </Button>
              {scanResult && (
                <Button onClick={() => setScanResult(null)} variant="outline" size="sm">
                  Scan Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 