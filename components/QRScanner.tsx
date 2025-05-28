'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, Camera, CheckCircle, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen && videoRef.current) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

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

      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('[QR Scanner] QR code detected:', result);
          setScanResult(result.data);
          onScanResult(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera if available
          maxScansPerSecond: 5,
        }
      );

      // Start scanning
      await qrScannerRef.current.start();
      setHasPermission(true);
      console.log('[QR Scanner] Scanner started successfully');

    } catch (err: any) {
      console.error('[QR Scanner] Error starting scanner:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this device.');
      } else {
        setError(err.message || 'Failed to access camera. Please check your browser settings.');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Scanner Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scan overlay */}
            {hasPermission && !scanResult && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scan frame */}
                  <div className="w-64 h-64 border-2 border-white opacity-50 rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  </div>
                  <p className="text-white text-center mt-4 text-sm">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status/Results Area */}
          <div className="p-6 bg-white flex-shrink-0">
            {error && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Camera Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleTryAgain}
                  className="text-red-700 hover:text-red-800"
                >
                  Try Again
                </Button>
              </div>
            )}

            {scanResult && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900">QR Code Scanned!</h3>
                  <p className="text-sm text-green-700 mt-1 break-all">{scanResult}</p>
                </div>
              </div>
            )}

            {hasPermission && !error && !scanResult && (
              <div className="text-center py-4">
                <div className="animate-pulse">
                  <Camera className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Looking for QR codes...</p>
                  <p className="text-xs text-gray-500 mt-1">Make sure the QR code is well-lit and in focus</p>
                </div>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">Camera access is required to scan QR codes</p>
                <Button onClick={handleTryAgain} variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Grant Camera Access
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 flex-shrink-0">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            {scanResult && (
              <Button onClick={() => setScanResult(null)} variant="outline">
                Scan Another
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 